<?php
declare(strict_types=1);

$host='127.0.0.1'; $user='root'; $pass=''; $charset='utf8mb4';
try {
    $pdo=new PDO("mysql:host=$host;charset=$charset",$user,$pass,[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES=>false
    ]);
    $sql=file_get_contents(__DIR__.'/database/schema.sql');
    if($sql===false) throw new RuntimeException('schema.sql not found.');
    $pdo->exec($sql);
    echo '<h2>Database setup completed successfully.</h2>';
    echo '<p>Database: <strong>student_career_portal</strong></p>';
    echo '<p>Next: open <a href="../backend/create_demo_users.php">create_demo_users.php</a> once.</p>';
    echo '<p>Then open <a href="../login.html">Login</a>.</p>';
} catch(Throwable $e) {
    http_response_code(500);
    echo '<h2>Database setup failed</h2><pre>'.htmlspecialchars($e->getMessage()).'</pre>';
    echo '<p>Check MySQL is running and update the credentials in setup.php/config.php.</p>';
}
