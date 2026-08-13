<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
session_start();

function back(string $message): never {
    header('Location: ../login.html?error=' . rawurlencode($message));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../login.html');
    exit;
}

$email = trim((string)($_POST['email'] ?? ''));
$password = (string)($_POST['password'] ?? '');
$selectedRole = strtolower(trim((string)($_POST['role'] ?? '')));
$allowedRoles = ['student', 'recruiter', 'admin'];

if ($email === '' || $password === '') {
    back('Email and password are required.');
}

// Email is unique in the database, so authenticate by email first.
// The selected tab is used only as a preference; the real database role
// determines the destination. This prevents a stale/broken hidden role
// field from blocking a valid login.
$stmt = $pdo->prepare('SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, (string)$user['password_hash'])) {
    back('Invalid email or password.');
}

if ((string)$user['status'] !== 'active') {
    back('This account is not active.');
}

$actualRole = strtolower((string)$user['role']);
if (!in_array($actualRole, $allowedRoles, true)) {
    back('This account has an invalid role.');
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['role'] = $actualRole;
$_SESSION['name'] = (string)$user['full_name'];
$_SESSION['email'] = (string)$user['email'];

$targets = [
    'student' => '../student/dashboard.html',
    'recruiter' => '../recruit/recruiter_dashboard.html',
    'admin' => '../Admin/admin_dashboard.html'
];

header('Location: ' . $targets[$actualRole]);
exit;
?>
