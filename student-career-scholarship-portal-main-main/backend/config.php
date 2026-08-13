<?php

// ============================================================
// Database connection for Student Career & Scholarship Portal.
//
// This file is cloud-deployment friendly: it reads its settings
// from environment variables first, and only falls back to local
// XAMPP-style defaults when an environment variable is not set.
//
// On most hosts you set these as real environment variables
// (Apache SetEnv / nginx fastcgi_param / Docker / Render / Railway /
// Heroku config vars, etc). For simple shared hosting you may
// instead copy backend/.env.example to backend/.env and it will be
// loaded automatically below.
//
// Never commit real credentials. backend/.env is git-ignored.
// ============================================================

// ---- Minimal .env loader (no external dependency required) ----
$envFile = __DIR__ . '/.env';
if (is_file($envFile) && is_readable($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Strip surrounding quotes if present.
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

// ---- Database configuration (env vars override local defaults) ----
$host = env('DB_HOST', '127.0.0.1');
$port = env('DB_PORT', '3306');
$db = env('DB_NAME', 'student_career_portal');
$user = env('DB_USER', 'root');
$pass = env('DB_PASS', '');
$charset = env('DB_CHARSET', 'utf8mb4');

// ---- Application configuration ----
// APP_URL is the public base URL of the deployed site, used only where
// an absolute URL is required (e.g. generating shareable links). It is
// NOT required for the API to function since the frontend already calls
// the API using relative paths.
define('APP_URL', env('APP_URL', ''));
define('APP_ENV', env('APP_ENV', 'production'));

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    // In production, do not leak database connection details.
    if (APP_ENV === 'production') {
        error_log('Database connection failed: ' . $e->getMessage());
        die('Database connection failed. Please try again later.');
    }
    die('Database connection failed: ' . $e->getMessage());
}

// ---- Session cookie hardening (safe defaults for cloud/HTTPS hosting) ----
if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
    );
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}
?>
