<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['slug'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Slug no proporcionado']);
    exit;
}

$slug = $data['slug'];
$productFile = __DIR__ . '/products/' . $slug . '.json';

// Eliminar archivo individual
if (file_exists($productFile)) {
    unlink($productFile);
}

// Eliminar del índice (requiere leer y reescribir)
$indexFile = __DIR__ . '/products-index.json';
if (file_exists($indexFile)) {
    $index = json_decode(file_get_contents($indexFile), true);
    foreach ($index as $cat => $subs) {
        foreach ($subs as $sub => $items) {
            $index[$cat][$sub] = array_filter($items, function($item) use ($slug) {
                return ToSlug($item['Label']) !== $slug;
            });
            $index[$cat][$sub] = array_values($index[$cat][$sub]);
            if (empty($index[$cat][$sub])) {
                unset($index[$cat][$sub]);
            }
        }
        if (empty($index[$cat])) {
            unset($index[$cat]);
        }
    }
    file_put_contents($indexFile, json_encode($index, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

echo json_encode(['success' => true, 'slug' => $slug]);

// Helper function
function ToSlug($text) {
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/\s+/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}
