<?php
// ----------------------
// Configuration
// ----------------------
$DB_HOST = "localhost";
$DB_USER = "";
$DB_PASS = "";
$DB_NAME = "task_manager";

// Create uploads directory if it doesn't exist
$uploadDir = __DIR__ . '/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// ----------------------
// Database Connection
// ----------------------
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB Connection Failed: ".$conn->connect_error]));
}

// ----------------------
// Routing
// ----------------------
// Add CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$action = $_GET['action'] ?? '';
header('Content-Type: application/json');

if($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Upload certificate
    $title = $_POST['title'] ?? '';
    $recipient = $_POST['recipient'] ?? '';
    $issuer = $_POST['issuer'] ?? '';

    if(!$title || !$recipient || !$issuer || !isset($_FILES['file'])) {
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit;
    }

    try {
        // Generate unique filename
        $fileExtension = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
        $fileName = 'cert_' . time() . '_' . uniqid() . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;
        
        // Move uploaded file to uploads directory
        if (move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
            // Create public URL for the file
            $publicUrl = 'http://localhost/hackethon/uploads/' . $fileName;
            $hash = 'hash_' . time() . '_' . uniqid(); // Generate unique hash
            
            // Insert into DB
            $stmt = $conn->prepare("INSERT INTO certificates (title, recipient, issuer, cloud_url, hash, status) VALUES (?,?,?,?,?,?)");
            $status = 'pending';
            $stmt->bind_param("ssssss", $title, $recipient, $issuer, $publicUrl, $hash, $status);
            $stmt->execute();

            echo json_encode([
                "success" => true,
                "message" => "Certificate uploaded successfully",
                "data" => [
                    "title" => $title,
                    "recipient" => $recipient,
                    "issuer" => $issuer,
                    "cloud_url" => $publicUrl,
                    "hash" => $hash,
                    "status" => $status
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to upload file"]);
        }

    } catch(Exception $e){
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} elseif($action === 'verify' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $hash = $_POST['hash'] ?? '';
    if(!$hash) {
        echo json_encode(["success" => false, "message" => "Certificate hash required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM certificates WHERE hash=?");
    $stmt->bind_param("s", $hash);
    $stmt->execute();
    $result = $stmt->get_result();

    if($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Certificate not found."]);
        exit;
    }

    $cert = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "data" => $cert
    ]);

} elseif($action === 'all' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query("SELECT * FROM certificates ORDER BY created_at DESC");
    $certs = [];
    while($row = $result->fetch_assoc()) {
        $certs[] = $row;
    }
    echo json_encode(["success" => true, "certificates" => $certs]);

} else {
    echo json_encode(["success" => false, "message" => "Invalid action or method."]);
}
