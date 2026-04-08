<?php
declare(strict_types=1);

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

$dir = __DIR__;
$totalFile = $dir . DIRECTORY_SEPARATOR . 'total.txt';
$visitorIdsFile = $dir . DIRECTORY_SEPARATOR . 'stx_visitor_ids.txt';
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

/* distinct visitors by stx_aid (same idea as Netlify track.mjs) */
$uniqueCount = 0;
$vf = fopen($visitorIdsFile, 'c+');
if ($vf === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'open_visitors_failed']);
    exit;
}
flock($vf, LOCK_EX);
$vRaw = stream_get_contents($vf);
$vLines = preg_split('/\R+/', trim((string)$vRaw));
$seenIds = [];
if (is_array($vLines)) {
    foreach ($vLines as $line) {
        $line = trim($line);
        if ($line !== '') {
            $seenIds[$line] = true;
        }
    }
}
if (!isset($seenIds[$visitorId])) {
    $seenIds[$visitorId] = true;
}
$allIds = array_keys($seenIds);
sort($allIds, SORT_STRING);
$uniqueCount = count($allIds);
rewind($vf);
ftruncate($vf, 0);
if ($uniqueCount > 0) {
    fwrite($vf, implode("\n", $allIds) . "\n");
}
fflush($vf);
flock($vf, LOCK_UN);
fclose($vf);

$itemsMade = 0;
if (file_exists($itemsFile)) {
    $itemsMade = (int)trim((string)file_get_contents($itemsFile));
    if ($itemsMade < 0) {
        $itemsMade = 0;
    }
}

/* Optional lightweight visit log (path + time); ignore read failures. */
$logLine = gmdate('Y-m-d\TH:i:s\Z') . "\t" . $visitorId . "\t" . str_replace(["\n", "\r"], ' ', $pagePath) . "\n";
@file_put_contents($dir . DIRECTORY_SEPARATOR . 'stx_visit_log.txt', $logLine, FILE_APPEND | LOCK_EX);

echo json_encode([
    'ok' => true,
    'total' => $total,
    'unique' => $uniqueCount,
    'items_made' => $itemsMade,
    'your_visits' => $yourVisits,
    'source' => 'shared-host-track',
]);
