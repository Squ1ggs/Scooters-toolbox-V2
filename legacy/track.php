<?php
declare(strict_types=1);

/**
 * Writable folder for total.txt, unique.txt, stx_visitor_ids.txt, stx_visits/, items_made.txt
 * (default: this file's directory). Optional: STX_STATS_DATA_DIR = absolute path.
 * Set STX_VISIT_LOG=1 to append stx_visit_log.txt (off by default — was a slowdown).
 */
function stx_stats_data_dir(): string
{
    $env = getenv('STX_STATS_DATA_DIR');
    if (is_string($env)) {
        $trim = rtrim($env, "/\\");
        if ($trim !== '' && is_dir($trim)) {
            return $trim;
        }
    }
    return __DIR__;
}

function stx_count_nonempty_lines(string $raw): int
{
    $n = 0;
    $lines = preg_split('/\R+/', trim($raw));
    if (!is_array($lines)) {
        return 0;
    }
    foreach ($lines as $line) {
        if (trim($line) !== '') {
            $n++;
        }
    }
    return $n;
}

/** Cached line count for large list files; refreshes when source mtime changes. */
function stx_cached_line_count(string $sourceFile, string $cacheFile): int
{
    if (!file_exists($sourceFile)) {
        return 0;
    }
    $mtime = (string)@filemtime($sourceFile);
    if (file_exists($cacheFile)) {
        $raw = (string)@file_get_contents($cacheFile);
        $parts = explode('|', trim($raw), 2);
        if (count($parts) === 2 && $parts[0] === $mtime) {
            return max(0, (int)$parts[1]);
        }
    }
    $count = stx_count_nonempty_lines((string)file_get_contents($sourceFile));
    @file_put_contents($cacheFile, $mtime . '|' . $count, LOCK_EX);
    return $count;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-STX-Counter-Key, X-STX-Items-Bump-Key, X-STX-Track-Key, X-STX-Admin-Key');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

/* Form POST avoids browser CORS preflight (strict nginx often strips PHP CORS on OPTIONS). JSON still supported. */
$ct = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
$data = [];
if (strpos($ct, 'application/json') !== false) {
    $rawBody = file_get_contents('php://input');
    $parsed = json_decode((string)$rawBody, true);
    $data = is_array($parsed) ? $parsed : [];
} else {
    $data = $_POST;
    if (!is_array($data)) {
        $data = [];
    }
}

$expectedKey = getenv('STX_TRACK_KEY') ?: getenv('STX_ANALYTICS_TRACK_KEY') ?: '';
if ($expectedKey !== '') {
    $got = $_SERVER['HTTP_X_STX_TRACK_KEY'] ?? ($data['track_key'] ?? '');
    if (!is_string($got) || trim($got) !== $expectedKey) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }
}

$visitorId = trim((string)($data['visitor_id'] ?? ''));
$pagePath = trim((string)($data['path'] ?? '/')) ?: '/';
if (strlen($pagePath) > 500) {
    $pagePath = substr($pagePath, 0, 500);
}
if ($visitorId === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'visitor_id_required']);
    exit;
}
if (strlen($visitorId) > 200) {
    $visitorId = substr($visitorId, 0, 200);
}

$dir = stx_stats_data_dir();
$totalFile = $dir . DIRECTORY_SEPARATOR . 'total.txt';
$visitorIdsFile = $dir . DIRECTORY_SEPARATOR . 'stx_visitor_ids.txt';
$visitorCountCache = $dir . DIRECTORY_SEPARATOR . 'stx_visitor_ids.count';
$uniqueIpFile = $dir . DIRECTORY_SEPARATOR . 'unique.txt';
$uniqueIpCountCache = $dir . DIRECTORY_SEPARATOR . 'unique.count';
$itemsFile = $dir . DIRECTORY_SEPARATOR . 'items_made.txt';

/* Per-browser load count — same field as Netlify track (`your_visits`). */
$yourVisits = 1;
$visDir = $dir . DIRECTORY_SEPARATOR . 'stx_visits';
if (!is_dir($visDir)) {
    @mkdir($visDir, 0755, true);
}
$cntFile = $visDir . DIRECTORY_SEPARATOR . hash('sha256', $visitorId) . '.cnt';
$cf = fopen($cntFile, 'c+');
if ($cf !== false) {
    flock($cf, LOCK_EX);
    $cRaw = stream_get_contents($cf);
    $prior = (int)trim((string)$cRaw);
    if ($prior < 0) {
        $prior = 0;
    }
    $yourVisits = $prior + 1;
    rewind($cf);
    ftruncate($cf, 0);
    fwrite($cf, (string)$yourVisits);
    fflush($cf);
    flock($cf, LOCK_UN);
    fclose($cf);
}

/* total++ */
$total = 0;
$tf = fopen($totalFile, 'c+');
if ($tf === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'open_total_failed']);
    exit;
}
flock($tf, LOCK_EX);
$tRaw = stream_get_contents($tf);
$total = (int)trim((string)$tRaw);
$total++;
if ($total < 0) {
    $total = 1;
}
rewind($tf);
ftruncate($tf, 0);
fwrite($tf, (string)$total);
fflush($tf);
flock($tf, LOCK_UN);
fclose($tf);

/*
 * Distinct visitors by stx_aid — append-only when new (no full-file rewrite/sort every hit).
 */
$uniqueVisitors = 0;
$vf = fopen($visitorIdsFile, 'c+');
if ($vf === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'open_visitors_failed']);
    exit;
}
flock($vf, LOCK_EX);
$vRaw = (string)stream_get_contents($vf);
$hay = "\n" . str_replace(["\r\n", "\r"], "\n", $vRaw) . "\n";
$needle = "\n" . $visitorId . "\n";
$isNew = ($visitorId !== '' && strpos($hay, $needle) === false);
if ($isNew) {
    if ($vRaw !== '' && substr($vRaw, -1) !== "\n") {
        fwrite($vf, "\n");
    }
    fwrite($vf, $visitorId . "\n");
    fflush($vf);
    $uniqueVisitors = stx_count_nonempty_lines($vRaw) + 1;
    flock($vf, LOCK_UN);
    fclose($vf);
    $vf = null;
    @file_put_contents($visitorCountCache, (string)@filemtime($visitorIdsFile) . '|' . $uniqueVisitors, LOCK_EX);
} else {
    flock($vf, LOCK_UN);
    fclose($vf);
    $vf = null;
    $uniqueVisitors = stx_cached_line_count($visitorIdsFile, $visitorCountCache);
}
if ($vf !== null) {
    flock($vf, LOCK_UN);
    fclose($vf);
}

/* Legacy GET counter used unique.txt (IPs); keep display from cliffing. */
$uniqueIpsLegacy = stx_cached_line_count($uniqueIpFile, $uniqueIpCountCache);
$uniqueCount = max($uniqueVisitors, $uniqueIpsLegacy);

$itemsMade = 0;
if (file_exists($itemsFile)) {
    $itemsMade = (int)trim((string)file_get_contents($itemsFile));
    if ($itemsMade < 0) {
        $itemsMade = 0;
    }
}

/* Optional visit log — off unless STX_VISIT_LOG=1 (append+lock was contributing to slowdowns). */
$logEnv = strtolower((string)(getenv('STX_VISIT_LOG') ?: ''));
if ($logEnv === '1' || $logEnv === 'true' || $logEnv === 'yes' || $logEnv === 'on') {
    $logLine = gmdate('Y-m-d\TH:i:s\Z') . "\t" . $visitorId . "\t" . str_replace(["\n", "\r"], ' ', $pagePath) . "\n";
    @file_put_contents($dir . DIRECTORY_SEPARATOR . 'stx_visit_log.txt', $logLine, FILE_APPEND | LOCK_EX);
}

echo json_encode([
    'ok' => true,
    'total' => $total,
    'unique' => $uniqueCount,
    'items_made' => $itemsMade,
    'your_visits' => $yourVisits,
    'source' => 'shared-host-track',
]);
