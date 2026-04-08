<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-STX-Counter-Key, X-STX-Items-Bump-Key, X-STX-Track-Key, X-STX-Admin-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$ct = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
$data = [];
if (strpos($ct, 'application/json') !== false) {
    $body = file_get_contents('php://input');
    $parsed = json_decode((string)$body, true);
    $data = is_array($parsed) ? $parsed : [];
} else {
    $data = $_POST;
    if (!is_array($data)) {
        $data = [];
    }
}

/* Optional key gate (set in env as STX_ITEMS_BUMP_KEY). Leave empty to disable. */
$expectedKey = getenv('STX_ITEMS_BUMP_KEY') ?: '';
if ($expectedKey !== '') {
    $got = $_SERVER['HTTP_X_STX_ITEMS_BUMP_KEY'] ?? ($data['items_bump_key'] ?? '');
    if (!is_string($got) || trim($got) !== $expectedKey) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }
}
$delta = (int)($data['delta'] ?? 1);
if ($delta < 1) $delta = 1;
if ($delta > 1000) $delta = 1000;

$dir = __DIR__;
$itemsFile = $dir . DIRECTORY_SEPARATOR . 'items_made.txt';
$totalFile = $dir . DIRECTORY_SEPARATOR . 'total.txt';
$uniqueFile = $dir . DIRECTORY_SEPARATOR . 'unique.txt';

/* items_made += delta with lock */
$itemsMade = 0;
$f = fopen($itemsFile, 'c+');
if ($f === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'open_items_failed']);
    exit;
}
flock($f, LOCK_EX);
$raw = stream_get_contents($f);
$itemsMade = (int)trim((string)$raw);
$itemsMade += $delta;
if ($itemsMade < 0) $itemsMade = 0;
rewind($f);
ftruncate($f, 0);
fwrite($f, (string)$itemsMade);
fflush($f);
flock($f, LOCK_UN);
fclose($f);

/* include current total/unique for UI parity */
$total = file_exists($totalFile) ? (int)trim((string)file_get_contents($totalFile)) : 0;
$unique = 0;
if (file_exists($uniqueFile)) {
    $lines = file($uniqueFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $unique = is_array($lines) ? count($lines) : 0;
}

echo json_encode([
    'ok' => true,
    'items_made' => $itemsMade,
    'total' => max(0, $total),
    'unique' => max(0, $unique)
]);

