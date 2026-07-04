<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['slug']) || !isset($data['product'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

$slug = $data['slug'];
$product = $data['product'];

// Guardar archivo individual
$productFile = __DIR__ . '/products/' . $slug . '.json';
file_put_contents($productFile, json_encode($product, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Actualizar índice
$indexFile = __DIR__ . '/products-index.json';
$index = json_decode(file_get_contents($indexFile), true);

if (!isset($index[$product['Category']])) {
    $index[$product['Category']] = [];
}
if (!isset($index[$product['Category']][$product['SubCategory']])) {
    $index[$product['Category']][$product['SubCategory']] = [];
}

// Buscar y reemplazar o agregar
$found = false;
foreach ($index[$product['Category']][$product['SubCategory']] as $key => $item) {
    if ($item['Label'] === $product['Label']) {
        $index[$product['Category']][$product['SubCategory']][$key] = [
            'Label' => $product['Label'],
            'Price' => $product['Price'],
            'Features' => $product['Features'],
            'Date' => $product['Date'],
            'Update' => $product['Update']
        ];
        $found = true;
        break;
    }
}
if (!$found) {
    $index[$product['Category']][$product['SubCategory']][] = [
        'Label' => $product['Label'],
        'Price' => $product['Price'],
        'Features' => $product['Features'],
        'Date' => $product['Date'],
        'Update' => $product['Update']
    ];
}

file_put_contents($indexFile, json_encode($index, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['success' => true, 'slug' => $slug]);

// ===== FUNCIÓN CORREGIDA: CONVIERTE ACENTOS =====
function ToSlug($text) {
    $text = strtolower($text);
    // Convertir acentos
    $map = ['á'=>'a', 'é'=>'e', 'í'=>'i', 'ó'=>'o', 'ú'=>'u', 'ü'=>'u', 'ñ'=>'n'];
    $text = str_replace(array_keys($map), array_values($map), $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/\s+/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}
