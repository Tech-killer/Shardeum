<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "hackethon";

// Connect to DB
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

// Store task transaction if status is pending or completed
function storeTaskTransaction($conn, $task) {
    $status = strtolower($task['status'] ?? '');
    if($status === "open") return; // Do nothing

    $stmt = $conn->prepare(
        "INSERT INTO task_transactions (task_id, title, assignee, creator, status, reward_amount, reward_token, blockchain_proof) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $task_id = $task['id'];
    $title = $task['title'];
    $assignee = $task['assignee'] ?? '';
    $creator = $task['creator'] ?? '';
    $reward_amount = $task['reward_amount'] ?? 0;
    $reward_token = $task['reward_token'] ?? 'SHM';
    $blockchain_proof = $task['blockchain_proof'] ?? null;

    $stmt->bind_param("issssdss", $task_id, $title, $assignee, $creator, $status, $reward_amount, $reward_token, $blockchain_proof);
    $stmt->execute();
    $stmt->close();
}

// Fetch all task transaction history
function fetchTaskTransactions($conn) {
    $sql = "SELECT * FROM task_transactions ORDER BY created_at DESC";
    $result = $conn->query($sql);
    $transactions = [];
    if($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }
    }
    echo json_encode(["status" => "success", "data" => $transactions]);
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];

if ($method === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    if(!isset($data['tasks']) || !is_array($data['tasks'])) {
        echo json_encode(["status" => "error", "message" => "Invalid input"]);
        exit;
    }
    foreach($data['tasks'] as $task) {
        storeTaskTransaction($conn, $task);
    }
    echo json_encode(["status" => "success", "message" => "Transactions stored for eligible tasks"]);
} elseif ($method === "GET") {
    fetchTaskTransactions($conn);
} elseif ($method === "OPTIONS") {
    http_response_code(200);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}

$conn->close();
?>
