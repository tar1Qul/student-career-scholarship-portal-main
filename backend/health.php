<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

// Health diagnostics disclose deployment details, so expose only a minimal
// authenticated admin check rather than PHP/database internals.
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Admin access required.']);
    exit;
}

try {
    $pdo->query('SELECT 1');
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    error_log('Portal health check failed: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'Database unavailable.']);
}
