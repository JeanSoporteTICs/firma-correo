<?php
header('Content-Type: application/json; charset=utf-8');

function respond($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sanitize_key($key): string {
    $key = (string)$key;
    if (!preg_match('/^custom_[a-zA-Z0-9_]+$/', $key)) {
        return '';
    }
    return $key;
}

$storageDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'designs';
if (!is_dir($storageDir) && !@mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
    respond(['ok' => false, 'error' => 'No se pudo crear directorio de almacenamiento.'], 500);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $files = glob($storageDir . DIRECTORY_SEPARATOR . 'custom_*.json') ?: [];
    $items = [];
    foreach ($files as $file) {
        $raw = @file_get_contents($file);
        if ($raw === false) continue;
        $json = json_decode($raw, true);
        if (!is_array($json)) continue;
        $key = sanitize_key($json['key'] ?? basename($file, '.json'));
        if ($key === '') continue;
        $name = trim((string)($json['name'] ?? 'Nuevo diseño'));
        $profile = is_array($json['profile'] ?? null) ? $json['profile'] : [];
        $items[] = ['key' => $key, 'name' => $name, 'profile' => $profile];
    }
    respond(['ok' => true, 'items' => $items]);
}

if ($method !== 'POST') {
    respond(['ok' => false, 'error' => 'Método no permitido'], 405);
}

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($payload)) $payload = [];
$action = (string)($payload['action'] ?? '');

if ($action === 'save') {
    $key = sanitize_key($payload['key'] ?? '');
    if ($key === '') respond(['ok' => false, 'error' => 'Clave inválida'], 422);
    $name = trim((string)($payload['name'] ?? 'Nuevo diseño'));
    $profile = is_array($payload['profile'] ?? null) ? $payload['profile'] : [];
    $body = [
        'key' => $key,
        'name' => $name,
        'profile' => $profile,
        'updated_at' => date('c')
    ];
    $path = $storageDir . DIRECTORY_SEPARATOR . $key . '.json';
    $ok = @file_put_contents($path, json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    if ($ok === false) respond(['ok' => false, 'error' => 'No se pudo guardar archivo'], 500);
    respond(['ok' => true]);
}

if ($action === 'delete') {
    $key = sanitize_key($payload['key'] ?? '');
    if ($key === '') respond(['ok' => false, 'error' => 'Clave inválida'], 422);
    $path = $storageDir . DIRECTORY_SEPARATOR . $key . '.json';
    if (is_file($path) && !@unlink($path)) {
        respond(['ok' => false, 'error' => 'No se pudo eliminar archivo'], 500);
    }
    respond(['ok' => true]);
}

respond(['ok' => false, 'error' => 'Acción inválida'], 422);

