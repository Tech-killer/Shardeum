<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

$servername = "sql210.infinityfree.com";
$username = "if0_39985390";
$password = "Ri49FOPVqoi";
$dbname = "if0_39985390_hackethon";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["status"=>"error","message"=>"Connection failed: ".$conn->connect_error]));
}

if ($_SERVER['REQUEST_METHOD'] === "GET") {
    $result = $conn->query("SELECT * FROM tasks ORDER BY created_at DESC");
    $transactions = [];
    
    if ($result && $result->num_rows > 0) {
        while ($task = $result->fetch_assoc()) {
            $transaction = [
                "id" => $task['id'],
                "task_id" => $task['id'],
                "title" => $task['title'],
                "assignee" => $task['assignee'] ?? '',
                "creator" => $task['creator'] ?? '',
                "status" => $task['status'],
                "reward_amount" => 0.0001, // Fixed transaction fee for all tasks
                "reward_token" => $task['reward_token'] ?? 'SHM',
                "blockchain_proof" => $task['blockchain_proof'] ?? ('task_' . $task['id'] . '_' . time()),
                "created_at" => $task['created_at'],
                "usd_value" => "$0.00"
            ];
            
            if ($task['status'] === 'open') {
                $transaction['transaction_type'] = 'task_created';
                $transaction['description'] = 'Task created and available for assignment';
            } elseif ($task['status'] === 'in_progress') {
                $transaction['transaction_type'] = 'task_accepted';
                $transaction['description'] = 'Task accepted and in progress';
            } elseif ($task['status'] === 'completed') {
                $transaction['transaction_type'] = 'task_completed';
                $transaction['description'] = 'Task completed and reward distributed';
            }
            
            $transactions[] = $transaction;
        }
    }
    
    echo json_encode([
        "success" => true,
        "transactions" => $transactions,
        "count" => count($transactions)
    ], JSON_PRESERVE_ZERO_FRACTION | JSON_NUMERIC_CHECK);
    exit;
}

echo json_encode(["status"=>"error","message"=>"Method not allowed"]);
$conn->close();
?>