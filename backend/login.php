<?php

session_start();

require_once __DIR__ . '/config.php';


// Only allow POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../login.html');
    exit;
}


// Get form data
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$role = strtolower(trim($_POST['role'] ?? ''));


// Allowed roles
$allowedRoles = ['student', 'recruiter', 'admin'];


// Validate input
if (!$email || !$password || !in_array($role, $allowedRoles, true)) {
    die('Email, password and valid role are required.');
}


// Find user
$stmt = $pdo->prepare(
    'SELECT id, full_name, email, password_hash, role, status
     FROM users
     WHERE email = ? AND role = ?
     LIMIT 1'
);

$stmt->execute([$email, $role]);

$user = $stmt->fetch();


// Check email/password
if (!$user || !password_verify($password, $user['password_hash'])) {
    die('Invalid email, password or selected role.');
}


// Check account status
if ($user['status'] !== 'active') {
    die('This account is not active.');
}


// Save login information in session
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['role'] = $user['role'];
$_SESSION['name'] = $user['full_name'];
$_SESSION['email'] = $user['email'];


// Redirect according to role
switch ($user['role']) {

    case 'student':
        header('Location: ../student/dashboard.html');
        exit;

    case 'recruiter':
        header('Location: ../recruit/recruiter_dashboard.html');
        exit;

    case 'admin':
        header('Location: ../Admin/admin_dashboard.html');
        exit;

    default:
        die('Invalid user role.');
}

?>