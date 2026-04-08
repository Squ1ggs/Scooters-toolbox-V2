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
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

/* Optional shared-host public key gate (set in file or env). Leave empty to disable. */
$expectedKey = getenv('STX_COUNTER_PUBLIC_KEY') ?: '';
if ($expectedKey !== '') {
    $got = $_SERVER['HTTP_X_STX_COUNTER_KEY'] ?? ($_GET['key'] ?? '');
    if (!is_string($got) || trim($got) !== $expectedKey) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden']);
        exit;
    }
}

$dir = __DIR__;
$totalFile = $dir . DIRECTORY_SEPARATOR . 'total.txt';
$uniqueFile = $dir . DIRECTORY_SEPARATOR . 'unique.txt';
$visitorIdsFile = $dir . DIRECTORY_SEPARATOR . 'stx_visitor_ids.txt';
$itemsFile = $dir . DIRECTORY_SEPARATOR . 'items_made.txt';

/**
 * Read-only GET (?read=1): same as Netlify counter GET — no side effects.
 * Page views / uniques are updated by track.php POST (visitor cookie), not by opening the stats UI.
 */
$readOnly = isset($_GET['read']) && ($_GET['read'] === '1' || $_GET['read'] === 'true');
if ($readOnly) {
    $total = 0;
    if (file_exists($totalFile)) {
        $total = (int)trim((string)file_get_contents($totalFile));
        if ($total < 0) {
            $total = 0;
        }
    }
    $uniqueCount = 0;
    if (file_exists($visitorIdsFile)) {
        $rawV = (string)file_get_contents($visitorIdsFile);
        $linesV = preg_split('/\R+/', trim($rawV));
        if (is_array($linesV)) {
            foreach ($linesV as $line) {
                if (trim($line) !== '') {
                    $uniqueCount++;
                }
            }
        }
    }
    if ($uniqueCount === 0 && file_exists($uniqueFile)) {
        $rawU = (string)file_get_contents($uniqueFile);
        $linesU = preg_split('/\R+/', trim($rawU));
        if (is_array($linesU)) {
            foreach ($linesU as $line) {
                if (trim($line) !== '') {
                    $uniqueCount++;
                }
            }
        }
    }
    $itemsMade = 0;
    if (file_exists($itemsFile)) {
        $itemsMade = (int)trim((string)file_get_contents($itemsFile));
        if ($itemsMade < 0) {
            $itemsMade = 0;
        }
    }
    echo json_encode([
        'ok' => true,
        'total' => $total,
        'unique' => $uniqueCount,
        'items_made' => $itemsMade,
        'read_only' => true,
    ]);
    exit;
}

/* Legacy: GET without read=1 increments total + IP unique (avoid for UI; use ?read=1 + track.php instead). */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if ($ip === '') {
    $ip = '0.0.0.0';
}

/* total++ with lock */
$total = 0;
$tf = fopen($totalFile, 'c+');
if ($tf === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'open_total_failed']);
    exit;
}
flock($tf, LOCK_EX);
$raw = stream_get_contents($tf);
$total = (int)trim((string)$raw);
$total++;
rewind($tf);
ftruncate($tf, 0);
fwrite($tf, (string)$total);
fflush($tf);
flock($tf, LOCK_UN);
fclose($tf);

/* unique set with lock */
$uniqueCount = 0;
$uf = fopen($uniqueFile, 'c+');
if ($uf === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'open_unique_failed']);
    exit;
}
flock($uf, LOCK_EX);
$rawUnique = stream_get_contents($uf);
$lines = preg_split('/\R+/', trim((string)$rawUnique));
$seen = [];
if (is_array($lines)) {
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line !== '') {
            $seen[$line] = true;
        }
    }
}
if (!isset($seen[$ip])) {
    $seen[$ip] = true;
}
$allIps = array_keys($seen);
sort($allIps, SORT_STRING);
rewind($uf);
ftruncate($uf, 0);
if (count($allIps) > 0) {
    fwrite($uf, implode("\n", $allIps) . "\n");
}
fflush($uf);
flock($uf, LOCK_UN);
fclose($uf);
$uniqueCount = count($allIps);

/* read items_made */
$itemsMade = 0;
if (file_exists($itemsFile)) {
    $itemsMade = (int)trim((string)file_get_contents($itemsFile));
    if ($itemsMade < 0) {
        $itemsMade = 0;
    }
}

echo json_encode([
    'ok' => true,
    'total' => $total,
    'unique' => $uniqueCount,
    'items_made' => $itemsMade,
]);
