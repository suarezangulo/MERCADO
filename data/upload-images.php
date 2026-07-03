<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$uploadDir = __DIR__ . '/../images/products/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$uploaded = [];
foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
    $originalName = $_FILES['images']['name'][$key];
    $destination = $uploadDir . $originalName;
    if (move_uploaded_file($tmpName, $destination)) {
        $uploaded[] = $originalName;
    }
}

echo json_encode(['success' => true, 'uploaded' => $uploaded, 'count' => count($uploaded)]);
