<?php
// Create OR reset local demo accounts for testing. Delete this file after use.
require_once __DIR__ . '/config.php';

$accounts = [
    ['name'=>'Portal Admin','email'=>'admin@portal.local','password'=>'Admin@123','role'=>'admin'],
    ['name'=>'Demo Recruiter','email'=>'recruiter@portal.local','password'=>'Recruiter@123','role'=>'recruiter'],
    ['name'=>'Demo Student','email'=>'student@portal.local','password'=>'Student@123','role'=>'student'],
];

foreach ($accounts as $a) {
    $hash = password_hash($a['password'], PASSWORD_DEFAULT);
    $check = $pdo->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
    $check->execute([$a['email']]);
    $id = $check->fetchColumn();

    if ($id) {
        $stmt = $pdo->prepare('UPDATE users SET full_name=?, password_hash=?, role=?, status=? WHERE id=?');
        $stmt->execute([$a['name'],$hash,$a['role'],'active',$id]);
        echo 'Reset: <b>'.htmlspecialchars($a['email']).'</b> | password: <b>'.htmlspecialchars($a['password']).'</b><br>';
    } else {
        $stmt = $pdo->prepare('INSERT INTO users (full_name,email,password_hash,role,status) VALUES (?,?,?,?,?)');
        $stmt->execute([$a['name'],$a['email'],$hash,$a['role'],'active']);
        $id = (int)$pdo->lastInsertId();
        echo 'Created: <b>'.htmlspecialchars($a['email']).'</b> | password: <b>'.htmlspecialchars($a['password']).'</b><br>';
    }

    if ($a['role']==='recruiter') {
        $stmt=$pdo->prepare('INSERT INTO recruiter_profiles (user_id,company_name,designation) VALUES (?,?,?) ON DUPLICATE KEY UPDATE company_name=VALUES(company_name), designation=VALUES(designation)');
        $stmt->execute([$id,'Demo Company','Recruiter']);
    } elseif ($a['role']==='student') {
        $stmt=$pdo->prepare('INSERT INTO student_profiles (user_id,university,department,cgpa,graduation_year) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE university=VALUES(university), department=VALUES(department), cgpa=VALUES(cgpa), graduation_year=VALUES(graduation_year)');
        $stmt->execute([$id,'University of Liberal Arts Bangladesh','Computer Science & Engineering',3.76,2028]);
    }
}

echo '<hr><b>Demo accounts are ready. Login using the passwords shown above.</b><br>';
echo 'Admin: admin@portal.local / Admin@123<br>';
echo 'Recruiter: recruiter@portal.local / Recruiter@123<br>';
echo 'Student: student@portal.local / Student@123<br>';
echo '<br><b>Delete create_demo_users.php after testing.</b>';
?>
