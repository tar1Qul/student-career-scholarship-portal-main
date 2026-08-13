<?php
declare(strict_types=1);

// One-time database installer. Uses the SAME environment-driven
// configuration as the rest of the app (backend/config.php / backend/.env)
// instead of hardcoded credentials, so it works identically on localhost
// and on cloud hosting.
//
// Delete this file (or at least restrict access to it) after running it
// once in production.

$envFile = __DIR__ . '/.env';
if (is_file($envFile) && is_readable($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (strlen($value) >= 2 && (
            ($value[0] === '"' && $value[-1] === '"') ||
            ($value[0] === "'" && $value[-1] === "'")
        )) {
            $value = substr($value, 1, -1);
        }
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
        }
    }
}

function env(string $key, string $default = ''): string {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$dbName = env('DB_NAME', 'student_career_portal');
$user = env('DB_USER', 'root');
$pass = env('DB_PASS', '');
$charset = env('DB_CHARSET', 'utf8mb4');

try {
    // Connect without selecting a database yet, since schema.sql creates it.
    $pdo = new PDO("mysql:host=$host;port=$port;charset=$charset", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $sql = file_get_contents(__DIR__ . '/database/schema.sql');
    if ($sql === false) {
        throw new RuntimeException('schema.sql not found.');
    }

    $pdo->exec($sql);

    echo '<h2>Database setup completed successfully.</h2>';
    echo '<p>Database: <strong>' . htmlspecialchars($dbName) . '</strong> on <strong>' . htmlspecialchars($host) . '</strong></p>';
    if ($dbName !== 'student_career_portal') {
        echo '<p style="color:#b45309">Note: database/schema.sql always creates a database literally named '
            . '<strong>student_career_portal</strong>, regardless of DB_NAME. Either set DB_NAME=student_career_portal, '
            . 'or edit the CREATE DATABASE / USE statements at the top of schema.sql to match your DB_NAME.</p>';
    }
    echo '<p>Next: open <a href="../backend/create_demo_users.php">create_demo_users.php</a> once (optional demo accounts).</p>';
    echo '<p>Then open <a href="../login.html">Login</a>.</p>';
    echo '<p style="color:#b45309">For security, delete backend/setup.php now that the database is installed.</p>';
} catch (Throwable $e) {
    http_response_code(500);
    echo '<h2>Database setup failed</h2><pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
    echo '<p>Check that MySQL is running and that DB_HOST / DB_USER / DB_PASS are correct ';
    echo '(set them as real environment variables, or copy backend/.env.example to backend/.env).</p>';
}
