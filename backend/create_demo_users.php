<?php
// Run this file once in XAMPP to create local demo Admin and Recruiter accounts.
// Then DELETE this file before deploying the project publicly.

require_once __DIR__ . '/config.php';

$accounts = [
    [
        'name' => 'Portal Admin',
        'email' => 'admin@portal.local',
        'password' => 'Admin@123',
        'role' => 'admin'
    ],
    [
        'name' => 'Demo Recruiter',
        'email' => 'recruiter@portal.local',
        'password' => 'Recruiter@123',
        'role' => 'recruiter'
    ]
];

foreach ($accounts as $account) {
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check->execute([$account['email']]);

    if ($check->fetch()) {
        echo "Already exists: {$account['email']}<br>";
        continue;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO users (full_name, email, password_hash, role)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $account['name'],
        $account['email'],
        password_hash($account['password'], PASSWORD_DEFAULT),
        $account['role']
    ]);

    $id = (int)$pdo->lastInsertId();

    if ($account['role'] === 'recruiter') {
        $stmt = $pdo->prepare(
            'INSERT INTO recruiter_profiles (user_id, company_name, designation)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$id, 'Demo Company', 'Recruiter']);
    }

    echo "Created: {$account['email']}<br>";
}

echo '<br>Demo setup complete. Delete create_demo_users.php after use.';
?>
