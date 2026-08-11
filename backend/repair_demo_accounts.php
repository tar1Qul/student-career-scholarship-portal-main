<?php
declare(strict_types=1);
// Local development helper. Run once, then delete this file.
require_once __DIR__ . '/config.php';

$accounts = [
    ['Portal Admin', 'admin@portal.local', 'Admin@123', 'admin'],
    ['Demo Recruiter', 'recruiter@portal.local', 'Recruiter@123', 'recruiter'],
    ['Demo Student', 'student@portal.local', 'Student@123', 'student'],
];

foreach ($accounts as [$name, $email, $password, $role]) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $id = $stmt->fetchColumn();

    if ($id) {
        $update = $pdo->prepare('UPDATE users SET full_name=?, password_hash=?, role=?, status="active" WHERE id=?');
        $update->execute([$name, $hash, $role, (int)$id]);
        echo "RESET: {$email} | {$password} | {$role}<br>";
    } else {
        $insert = $pdo->prepare('INSERT INTO users (full_name,email,password_hash,role,status) VALUES (?,?,?,?,"active")');
        $insert->execute([$name, $email, $hash, $role]);
        echo "CREATED: {$email} | {$password} | {$role}<br>";
    }
}

echo '<hr><b>Demo accounts repaired successfully.</b><br>';
echo 'Admin: admin@portal.local / Admin@123<br>';
echo 'Recruiter: recruiter@portal.local / Recruiter@123<br>';
echo 'Student: student@portal.local / Student@123<br>';
echo '<br>Delete repair_demo_accounts.php after testing.';
?>
