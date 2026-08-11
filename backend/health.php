<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
try {
    require_once __DIR__.'/config.php';
    $tables=$pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['ok'=>true,'php'=>PHP_VERSION,'database'=>'student_career_portal','tables'=>$tables],JSON_PRETTY_PRINT);
} catch(Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()],JSON_PRETTY_PRINT);
}
