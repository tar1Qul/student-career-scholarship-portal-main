<?php

// Create OR reset local demo accounts for testing.
// Delete this file after testing.

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
    ],
    [
        'name' => 'Demo Student',
        'email' => 'student@portal.local',
        'password' => 'Student@123',
        'role' => 'student'
    ]
];

foreach ($accounts as $account) {

    $hash = password_hash(
        $account['password'],
        PASSWORD_DEFAULT
    );

    // Check existing account
    $check = $pdo->prepare(
        'SELECT id FROM users WHERE email = ? LIMIT 1'
    );

    $check->execute([
        $account['email']
    ]);

    $id = $check->fetchColumn();

    if ($id) {

        // Reset existing account
        $stmt = $pdo->prepare(
            'UPDATE users
             SET full_name = ?,
                 password_hash = ?,
                 role = ?,
                 status = ?
             WHERE id = ?'
        );

        $stmt->execute([
            $account['name'],
            $hash,
            $account['role'],
            'active',
            $id
        ]);

        echo 'Reset: <b>' .
             htmlspecialchars($account['email']) .
             '</b> | Password: <b>' .
             htmlspecialchars($account['password']) .
             '</b><br>';

    } else {

        // Create new account
        $stmt = $pdo->prepare(
            'INSERT INTO users
            (full_name, email, password_hash, role, status)
            VALUES (?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $account['name'],
            $account['email'],
            $hash,
            $account['role'],
            'active'
        ]);

        $id = (int)$pdo->lastInsertId();

        echo 'Created: <b>' .
             htmlspecialchars($account['email']) .
             '</b> | Password: <b>' .
             htmlspecialchars($account['password']) .
             '</b><br>';
    }

    // Recruiter profile
    if ($account['role'] === 'recruiter') {

        $stmt = $pdo->prepare(
            'INSERT INTO recruiter_profiles
            (user_id, company_name, designation)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
            company_name = VALUES(company_name),
            designation = VALUES(designation)'
        );

        $stmt->execute([
            $id,
            'Demo Company',
            'Recruiter'
        ]);
    }

    // Student profile
    elseif ($account['role'] === 'student') {

        $stmt = $pdo->prepare(
            'INSERT INTO student_profiles
            (user_id, university, department, cgpa, graduation_year)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            university = VALUES(university),
            department = VALUES(department),
            cgpa = VALUES(cgpa),
            graduation_year = VALUES(graduation_year)'
        );

        $stmt->execute([
            $id,
            'University of Liberal Arts Bangladesh',
            'Computer Science & Engineering',
            3.76,
            2028
        ]);
    }
}

echo '<hr>';
echo '<b>Demo accounts are ready.</b><br><br>';

echo 'Admin: admin@portal.local / Admin@123<br>';
echo 'Recruiter: recruiter@portal.local / Recruiter@123<br>';
echo 'Student: student@portal.local / Student@123<br>';

echo '<br><b>Delete create_demo_users.php after testing.</b>';

?>