<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'], $_SESSION['role'])) {

    http_response_code(401);

    echo json_encode([
        'ok' => false,
        'message' => 'Please log in first.'
    ]);

    exit;
}

if ($_SESSION['role'] !== 'admin') {

    http_response_code(403);

    echo json_encode([
        'ok' => false,
        'message' => 'Admin access required.'
    ]);

    exit;
}

echo json_encode([
    'ok' => true,

    'user' => [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['name'],
        'email' => $_SESSION['email'],
        'role' => $_SESSION['role']
    ]
]);