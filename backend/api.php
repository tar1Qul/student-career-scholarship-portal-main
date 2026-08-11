<?php
declare(strict_types=1);

session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

function jsonResponse(bool $ok, $data = null, string $message = '', int $status = 200): never {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'data' => $data, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function requireLogin(): array {
    if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
        jsonResponse(false, null, 'Please log in first.', 401);
    }
    return [
        'id' => (int)$_SESSION['user_id'],
        'name' => (string)$_SESSION['name'],
        'email' => (string)$_SESSION['email'],
        'role' => (string)$_SESSION['role']
    ];
}

function requireRole(array $roles): array {
    $user = requireLogin();
    if (!in_array($user['role'], $roles, true)) {
        jsonResponse(false, null, 'You are not allowed to perform this action.', 403);
    }
    return $user;
}

function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $json = json_decode($raw, true);
        if (is_array($json)) return $json;
    }
    return $_POST;
}

function clean($value): string {
    return trim((string)($value ?? ''));
}

$action = clean($_GET['action'] ?? ($_POST['action'] ?? ''));
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        case 'me':
            jsonResponse(true, $_SESSION['user_id'] ?? null ? [
                'id' => (int)$_SESSION['user_id'],
                'name' => $_SESSION['name'],
                'email' => $_SESSION['email'],
                'role' => $_SESSION['role']
            ] : null);

        case 'student_dashboard':
            $u = requireRole(['student']);
            $stmt = $pdo->prepare("SELECT
                (SELECT COUNT(*) FROM applications WHERE student_id = ?) applications_count,
                (SELECT COUNT(*) FROM saved_items WHERE student_id = ?) saved_count,
                (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0) unread_notifications,
                (SELECT COUNT(*) FROM opportunities WHERE status='approved' AND (deadline IS NULL OR deadline >= CURDATE())) opportunities_count");
            $stmt->execute([$u['id'],$u['id'],$u['id']]);
            $stats = $stmt->fetch() ?: [];
            $p = $pdo->prepare("SELECT university, department, cgpa, graduation_year, bio, skills, profile_image FROM student_profiles WHERE user_id=?");
            $p->execute([$u['id']]);
            jsonResponse(true, ['user'=>$u,'profile'=>$p->fetch() ?: null,'stats'=>$stats]);

        case 'opportunities':
            requireLogin();
            $stmt = $pdo->query("SELECT o.*, u.full_name recruiter_name, rp.company_name
                FROM opportunities o JOIN users u ON u.id=o.recruiter_id
                LEFT JOIN recruiter_profiles rp ON rp.user_id=o.recruiter_id
                WHERE o.status='approved' AND (o.deadline IS NULL OR o.deadline >= CURDATE())
                ORDER BY o.created_at DESC");
            jsonResponse(true, $stmt->fetchAll());

        case 'scholarships':
            requireLogin();
            $stmt = $pdo->query("SELECT * FROM scholarships
                WHERE status='approved' AND (deadline IS NULL OR deadline >= CURDATE())
                ORDER BY deadline IS NULL, deadline ASC, created_at DESC");
            jsonResponse(true, $stmt->fetchAll());

        case 'applications':
            $u = requireRole(['student']);
            $stmt = $pdo->prepare("SELECT a.*, o.title opportunity_title, o.organization,
                s.title scholarship_title, s.provider scholarship_provider
                FROM applications a
                LEFT JOIN opportunities o ON o.id=a.opportunity_id
                LEFT JOIN scholarships s ON s.id=a.scholarship_id
                WHERE a.student_id=? ORDER BY a.applied_at DESC");
            $stmt->execute([$u['id']]);
            jsonResponse(true, $stmt->fetchAll());

        case 'saved':
            $u = requireRole(['student']);
            $stmt = $pdo->prepare("SELECT si.*, o.title opportunity_title, o.organization, o.location, o.deadline opportunity_deadline,
                s.title scholarship_title, s.provider scholarship_provider, s.deadline scholarship_deadline
                FROM saved_items si
                LEFT JOIN opportunities o ON o.id=si.opportunity_id
                LEFT JOIN scholarships s ON s.id=si.scholarship_id
                WHERE si.student_id=? ORDER BY si.saved_at DESC");
            $stmt->execute([$u['id']]);
            jsonResponse(true, $stmt->fetchAll());

        case 'notifications':
            $u = requireRole(['student','recruiter','admin']);
            if ($method === 'POST') {
                $d=body();
                if (($d['mode'] ?? '') === 'read_all') {
                    $stmt=$pdo->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?");
                    $stmt->execute([$u['id']]);
                    jsonResponse(true, null, 'Notifications marked as read.');
                }
            }
            $stmt=$pdo->prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50");
            $stmt->execute([$u['id']]);
            jsonResponse(true,$stmt->fetchAll());

        case 'profile':
            $u = requireLogin();
            if ($method === 'GET') {
                if ($u['role']==='student') {
                    $stmt=$pdo->prepare("SELECT u.full_name,u.email,u.phone,p.* FROM users u LEFT JOIN student_profiles p ON p.user_id=u.id WHERE u.id=?");
                } elseif ($u['role']==='recruiter') {
                    $stmt=$pdo->prepare("SELECT u.full_name,u.email,u.phone,p.* FROM users u LEFT JOIN recruiter_profiles p ON p.user_id=u.id WHERE u.id=?");
                } else {
                    $stmt=$pdo->prepare("SELECT id,full_name,email,phone,role,status FROM users WHERE id=?");
                }
                $stmt->execute([$u['id']]);
                jsonResponse(true,$stmt->fetch() ?: null);
            }
            $d=body();
            $name=clean($d['full_name'] ?? $d['fullName'] ?? '');
            $phone=clean($d['phone'] ?? '');
            if ($name==='') jsonResponse(false,null,'Name is required.',422);
            $pdo->beginTransaction();
            $stmt=$pdo->prepare("UPDATE users SET full_name=?, phone=? WHERE id=?");
            $stmt->execute([$name,$phone,$u['id']]);
            $_SESSION['name']=$name;
            if ($u['role']==='student') {
                $stmt=$pdo->prepare("INSERT INTO student_profiles (user_id,university,department,cgpa) VALUES (?,?,?,?)
                    ON DUPLICATE KEY UPDATE university=VALUES(university),department=VALUES(department),cgpa=VALUES(cgpa),
                    graduation_year=VALUES(graduation_year),bio=VALUES(bio),skills=VALUES(skills),linkedin_url=VALUES(linkedin_url),portfolio_url=VALUES(portfolio_url)");
                $stmt->execute([$u['id'],clean($d['university']??''),clean($d['department']??''),($d['cgpa']??'')===''?null:(float)$d['cgpa']]);
                $stmt=$pdo->prepare("UPDATE student_profiles SET graduation_year=?,bio=?,skills=?,linkedin_url=?,portfolio_url=? WHERE user_id=?");
                $stmt->execute([$d['graduation_year']??null,clean($d['bio']??''),clean($d['skills']??''),clean($d['linkedin_url']??''),clean($d['portfolio_url']??''),$u['id']]);
            } elseif ($u['role']==='recruiter') {
                $stmt=$pdo->prepare("INSERT INTO recruiter_profiles (user_id,company_name,designation,company_email,company_phone,company_website,company_description)
                    VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE company_name=VALUES(company_name),designation=VALUES(designation),
                    company_email=VALUES(company_email),company_phone=VALUES(company_phone),company_website=VALUES(company_website),company_description=VALUES(company_description)");
                $stmt->execute([$u['id'],clean($d['organization']??$d['company_name']??''),clean($d['designation']??''),clean($d['company_email']??''),clean($d['company_phone']??''),clean($d['company_website']??''),clean($d['company_description']??$d['aboutOrganization']??'')]);
            }
            $pdo->commit();
            jsonResponse(true,null,'Profile updated successfully.');

        case 'apply':
            $u=requireRole(['student']);
            $d=body();
            $oid=isset($d['opportunity_id']) && $d['opportunity_id']!=='' ? (int)$d['opportunity_id'] : null;
            $sid=isset($d['scholarship_id']) && $d['scholarship_id']!=='' ? (int)$d['scholarship_id'] : null;
            if (($oid===null && $sid===null) || ($oid!==null && $sid!==null)) jsonResponse(false,null,'Select one opportunity or scholarship.',422);
            if ($oid!==null) {
                $check=$pdo->prepare("SELECT id,title,recruiter_id FROM opportunities WHERE id=? AND status='approved'");
                $check->execute([$oid]); $item=$check->fetch();
                if (!$item) jsonResponse(false,null,'Opportunity not found.',404);
            } else {
                $check=$pdo->prepare("SELECT id,title FROM scholarships WHERE id=? AND status='approved'");
                $check->execute([$sid]); $item=$check->fetch();
                if (!$item) jsonResponse(false,null,'Scholarship not found.',404);
            }
            $stmt=$pdo->prepare("INSERT INTO applications(student_id,opportunity_id,scholarship_id,resume_path,cover_letter) VALUES(?,?,?,?,?)");
            try {
                $stmt->execute([$u['id'],$oid,$sid,clean($d['resume_path']??''),clean($d['cover_letter']??'')]);
            } catch(PDOException $e) {
                if ((int)($e->errorInfo[1]??0)===1062) jsonResponse(false,null,'You have already applied.',409);
                throw $e;
            }
            $applicationId=(int)$pdo->lastInsertId();
            $recipient = $oid ? (int)$item['recruiter_id'] : null;
            if ($recipient) {
                $n=$pdo->prepare("INSERT INTO notifications(user_id,title,message,type,related_application_id) VALUES(?,?,?,?,?)");
                $n->execute([$recipient,'New application',"{$u['name']} applied to {$item['title']}",'application',$applicationId]);
            }
            jsonResponse(true,['id'=>$applicationId],'Application submitted successfully.');

        case 'save':
            $u=requireRole(['student']); $d=body();
            $oid=isset($d['opportunity_id']) && $d['opportunity_id']!=='' ? (int)$d['opportunity_id'] : null;
            $sid=isset($d['scholarship_id']) && $d['scholarship_id']!=='' ? (int)$d['scholarship_id'] : null;
            if (($oid===null && $sid===null) || ($oid!==null && $sid!==null)) jsonResponse(false,null,'Select one item.',422);
            $check=$pdo->prepare("SELECT id FROM saved_items WHERE student_id=? AND ((opportunity_id=? AND ? IS NOT NULL) OR (scholarship_id=? AND ? IS NOT NULL)) LIMIT 1");
            $check->execute([$u['id'],$oid,$oid,$sid,$sid]);
            $existing = $check->fetchColumn();
            if ($existing !== false) {
                $del=$pdo->prepare("DELETE FROM saved_items WHERE id=?"); $del->execute([(int)$existing]);
            } else {
                $stmt=$pdo->prepare("INSERT INTO saved_items(student_id,opportunity_id,scholarship_id) VALUES(?,?,?)");
                $stmt->execute([$u['id'],$oid,$sid]);
            }
            jsonResponse(true,null,'Saved item updated.');

        case 'recruiter_dashboard':
            $u=requireRole(['recruiter']);
            $stmt=$pdo->prepare("SELECT
                (SELECT COUNT(*) FROM opportunities WHERE recruiter_id=?) total,
                (SELECT COUNT(*) FROM opportunities WHERE recruiter_id=? AND status='approved') approved,
                (SELECT COUNT(*) FROM opportunities WHERE recruiter_id=? AND status='pending') pending,
                (SELECT COUNT(*) FROM applications a JOIN opportunities o ON o.id=a.opportunity_id WHERE o.recruiter_id=?) applications");
            $stmt->execute([$u['id'],$u['id'],$u['id'],$u['id']]);
            $stats=$stmt->fetch();
            $stmt=$pdo->prepare("SELECT o.*, (SELECT COUNT(*) FROM applications a WHERE a.opportunity_id=o.id) applicant_count FROM opportunities o WHERE recruiter_id=? ORDER BY created_at DESC");
            $stmt->execute([$u['id']]);
            jsonResponse(true,['user'=>$u,'stats'=>$stats,'opportunities'=>$stmt->fetchAll()]);

        case 'opportunity_create':
            $u=requireRole(['recruiter']); $d=body();
            $title=clean($d['title']??''); $org=clean($d['organization']??''); $location=clean($d['location']??'');
            $deadline=clean($d['deadline']??''); $description=clean($d['description']??''); $requirements=clean($d['requirements']??$d['eligibility']??'');
            $category=clean($d['category']??''); $type=strtolower(clean($d['opportunity_type']??$d['type']??'job'));
            $map=['internship'=>'internship','job'=>'job','research'=>'research','competition'=>'competition','other'=>'other'];
            $type=$map[$type]??'job';
            if ($title===''||$org===''||$location===''||$deadline===''||$description==='') jsonResponse(false,null,'Please complete all required fields.',422);
            $stmt=$pdo->prepare("INSERT INTO opportunities(recruiter_id,title,organization,category,opportunity_type,location,description,requirements,deadline,status) VALUES(?,?,?,?,?,?,?,?,?,'pending')");
            $stmt->execute([$u['id'],$title,$org,$category,$type,$location,$description,$requirements,$deadline]);
            jsonResponse(true,['id'=>(int)$pdo->lastInsertId()],'Opportunity submitted for admin verification.');

        case 'opportunity_delete':
            $u=requireRole(['recruiter']); $d=body(); $id=(int)($d['id']??0);
            $stmt=$pdo->prepare("DELETE FROM opportunities WHERE id=? AND recruiter_id=?"); $stmt->execute([$id,$u['id']]);
            jsonResponse(true,null,'Opportunity deleted.');

        case 'opportunity_applicants':
            $u=requireRole(['recruiter','admin']); $d=body(); $id=(int)($d['opportunity_id']??0);
            $sql="SELECT a.*,u.full_name,u.email,sp.university,sp.department,sp.cgpa FROM applications a JOIN users u ON u.id=a.student_id LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE a.opportunity_id=?";
            if ($u['role']==='recruiter') $sql.=" AND EXISTS(SELECT 1 FROM opportunities o WHERE o.id=a.opportunity_id AND o.recruiter_id=".((int)$u['id']).")";
            $stmt=$pdo->prepare($sql); $stmt->execute([$id]); jsonResponse(true,$stmt->fetchAll());

        case 'admin_dashboard':
            requireRole(['admin']);
            $stats=$pdo->query("SELECT
                (SELECT COUNT(*) FROM users) users_count,
                (SELECT COUNT(*) FROM users WHERE role='student') students_count,
                (SELECT COUNT(*) FROM users WHERE role='recruiter') recruiters_count,
                (SELECT COUNT(*) FROM opportunities WHERE status='pending') pending_opportunities,
                (SELECT COUNT(*) FROM scholarships WHERE status='pending') pending_scholarships,
                (SELECT COUNT(*) FROM applications) applications_count")->fetch();
            jsonResponse(true,$stats);

        case 'admin_users':
            requireRole(['admin']);
            $stmt=$pdo->query("SELECT id,full_name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC");
            jsonResponse(true,$stmt->fetchAll());

        case 'admin_user_status':
            requireRole(['admin']); $d=body(); $id=(int)($d['id']??0); $status=clean($d['status']??'active');
            if (!in_array($status,['active','inactive','suspended'],true)) jsonResponse(false,null,'Invalid status.',422);
            $stmt=$pdo->prepare("UPDATE users SET status=? WHERE id=? AND role<>'admin'"); $stmt->execute([$status,$id]);
            jsonResponse(true,null,'User status updated.');

        case 'admin_opportunities':
            requireRole(['admin']);
            $stmt=$pdo->query("SELECT o.*,u.full_name recruiter_name FROM opportunities o JOIN users u ON u.id=o.recruiter_id ORDER BY o.created_at DESC");
            jsonResponse(true,$stmt->fetchAll());

        case 'admin_opportunity_status':
            $u=requireRole(['admin']); $d=body(); $id=(int)($d['id']??0); $status=clean($d['status']??'');
            if (!in_array($status,['pending','approved','rejected','closed'],true)) jsonResponse(false,null,'Invalid opportunity status.',422);
            $stmt=$pdo->prepare("UPDATE opportunities SET status=?,admin_note=? WHERE id=?"); $stmt->execute([$status,clean($d['admin_note']??''),$id]);
            $stmt=$pdo->prepare("SELECT recruiter_id,title FROM opportunities WHERE id=?"); $stmt->execute([$id]); $o=$stmt->fetch();
            if($o){
                $n=$pdo->prepare("INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)");
                $n->execute([(int)$o['recruiter_id'],'Opportunity status updated',"Your opportunity '{$o['title']}' is now {$status}.",'opportunity']);
            }
            jsonResponse(true,null,'Opportunity status updated.');

        case 'admin_scholarships':
            requireRole(['admin']);
            $stmt=$pdo->query("SELECT * FROM scholarships ORDER BY created_at DESC");
            jsonResponse(true,$stmt->fetchAll());

        case 'admin_scholarship_create':
            $u=requireRole(['admin']); $d=body();
            $title=clean($d['title']??''); $provider=clean($d['provider']??'');
            if($title===''||$provider==='') jsonResponse(false,null,'Title and provider are required.',422);
            $stmt=$pdo->prepare("INSERT INTO scholarships(title,provider,category,amount,description,eligibility,application_url,deadline,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$title,$provider,clean($d['category']??''),clean($d['amount']??''),clean($d['description']??''),clean($d['eligibility']??''),clean($d['application_url']??''),($d['deadline']??'')?:null,'approved',$u['id']]);
            jsonResponse(true,['id'=>(int)$pdo->lastInsertId()],'Scholarship created.');

        case 'admin_scholarship_status':
            requireRole(['admin']); $d=body(); $id=(int)($d['id']??0); $status=clean($d['status']??'');
            if(!in_array($status,['draft','pending','approved','rejected','closed'],true)) jsonResponse(false,null,'Invalid scholarship status.',422);
            $stmt=$pdo->prepare("UPDATE scholarships SET status=? WHERE id=?"); $stmt->execute([$status,$id]);
            jsonResponse(true,null,'Scholarship status updated.');

        case 'admin_delete':
            requireRole(['admin']); $d=body(); $type=clean($d['type']??''); $id=(int)($d['id']??0);
            $allowed=['user'=>'users','opportunity'=>'opportunities','scholarship'=>'scholarships'];
            if(!isset($allowed[$type])) jsonResponse(false,null,'Invalid delete type.',422);
            if($type==='user') $stmt=$pdo->prepare("DELETE FROM users WHERE id=? AND role<>'admin'");
            else $stmt=$pdo->prepare("DELETE FROM {$allowed[$type]} WHERE id=?");
            $stmt->execute([$id]); jsonResponse(true,null,'Record deleted.');

        default:
            jsonResponse(false,null,'Unknown API action.',404);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(false,null,'Server error: '.$e->getMessage(),500);
}
