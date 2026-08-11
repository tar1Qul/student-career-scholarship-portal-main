<?php

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../register.html');
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$phone = trim($_POST['phone'] ?? '');
$university = trim($_POST['university'] ?? '');
$department = trim($_POST['department'] ?? '');
$cgpa = trim($_POST['cgpa'] ?? '');


// Required field validation
if (!$name || !$email || !$password || !$phone || !$university || !$department) {
    die('Please complete all required fields.');
}


// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die('Please enter a valid email address.');
}


// Password validation
if (strlen($password) < 6) {
    die('Password must contain at least 6 characters.');
}


try {

    // Start database transaction
    $pdo->beginTransaction();


    // Hash password
    $hash = password_hash($password, PASSWORD_DEFAULT);


    // Insert user
    $stmt = $pdo->prepare(
        'INSERT INTO users
        (full_name, email, password_hash, role, phone)
        VALUES (?, ?, ?, "student", ?)'
    );

    $stmt->execute([
        $name,
        $email,
        $hash,
        $phone
    ]);


    // Get newly created user ID
    $userId = (int) $pdo->lastInsertId();


    // Convert CGPA to number
    $cgpaValue = ($cgpa !== '' && is_numeric($cgpa))
        ? (float) $cgpa
        : null;

    if ($cgpaValue !== null && ($cgpaValue < 0 || $cgpaValue > 4)) {
        throw new RuntimeException('CGPA must be between 0 and 4.');
    }


    // Insert student profile
    $stmt = $pdo->prepare(
        'INSERT INTO student_profiles
        (user_id, university, department, cgpa)
        VALUES (?, ?, ?, ?)'
    );

    $stmt->execute([
        $userId,
        $university,
        $department,
        $cgpaValue
    ]);


    // Optional profile image upload
    if (
        !empty($_FILES['profile_image']['name']) &&
        $_FILES['profile_image']['error'] === UPLOAD_ERR_OK
    ) {

        $uploadDir = dirname(__DIR__) . '/uploads/profile/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }


        $extension = strtolower(
            pathinfo(
                $_FILES['profile_image']['name'],
                PATHINFO_EXTENSION
            )
        );

        $allowed = ['jpg', 'jpeg', 'png', 'webp'];


        if (in_array($extension, $allowed, true)) {

            $filename =
                'student_' .
                $userId .
                '_' .
                time() .
                '.' .
                $extension;


            move_uploaded_file(
                $_FILES['profile_image']['tmp_name'],
                $uploadDir . $filename
            );


            // Save image path
            $stmt = $pdo->prepare(
                'UPDATE student_profiles
                 SET profile_image = ?
                 WHERE user_id = ?'
            );

            $stmt->execute([
                'uploads/profile/' . $filename,
                $userId
            ]);
        }
    }


    // Save all database changes
    $pdo->commit();


    // Redirect to login page
    header('Location: ../login.html?registered=1');
    exit;


} catch (Throwable $e) {

    // Undo database changes if something fails
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }


    // Duplicate email
    if (
        isset($e->errorInfo[1]) &&
        (int) $e->errorInfo[1] === 1062
    ) {
        die('An account with this email already exists.');
    }


    // Other database error
    die('Registration failed: ' . $e->getMessage());
}

?>