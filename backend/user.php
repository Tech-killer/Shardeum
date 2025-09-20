<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Address, Cache-Control, Pragma");
header("Access-Control-Allow-Methods: GET, PATCH, OPTIONS");
header("Content-Type: application/json");

// DB connection
$host = "localhost";
$user = "root";
$pass = "";
$db   = "task_manager";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB Connection failed"]));
}

// Current user wallet
$currentUser = $_SERVER['HTTP_X_USER_ADDRESS'] ?? null;

function respond($data) {
    echo json_encode($data);
    exit;
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') respond(["success" => true]);

// Get URL segments: user_api.php?task_id=1&action=accept
$taskId = $_GET['task_id'] ?? null;
$action = $_GET['action'] ?? null;
$debugTaskId = $_GET['debug_task_id'] ?? null;

// 🔍 DEBUG: Get single task status
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $debugTaskId) {
    $taskId = intval($debugTaskId);
    $sql = "SELECT id, title, assignee, status, created_at, updated_at FROM tasks WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        respond(["success" => false, "message" => "Task not found", "task_id" => $taskId]);
    }
    
    $task = $result->fetch_assoc();
    $stmt->close();
    
    respond([
        "success" => true, 
        "message" => "Task status retrieved", 
        "task" => $task,
        "debug_info" => [
            "request_time" => date('Y-m-d H:i:s'),
            "current_user" => $currentUser
        ]
    ]);
}

// 1️⃣ GET all tasks
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM tasks ORDER BY created_at DESC";
    $result = $conn->query($sql);
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $row['tags'] = $row['tags'] ? explode(",", $row['tags']) : [];
        $tasks[] = $row;
    }
    respond(["success" => true, "tasks" => $tasks]);
}

// 2️⃣ PATCH actions (accept / complete)
if ($_SERVER['REQUEST_METHOD'] === 'PATCH' && $taskId && $currentUser) {

    // Accept a task → move to Pending
    if ($action === "accept") {
        // Debug logging
        error_log("=== ACCEPT TASK DEBUG ===");
        error_log("Task ID: " . $taskId);
        error_log("Current User: " . $currentUser);
        
        // Sanitize task ID
        $taskId = intval($taskId);
        if ($taskId <= 0) {
            respond(["success" => false, "message" => "Invalid task ID"]);
        }
        
        // First check if task exists and is available
        $checkSql = "SELECT id, assignee, status, title FROM tasks WHERE id = ?";
        $stmt = $conn->prepare($checkSql);
        if (!$stmt) {
            respond(["success" => false, "message" => "Database error: " . $conn->error]);
        }
        
        $stmt->bind_param("i", $taskId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            respond(["success" => false, "message" => "Task not found"]);
        }
        
        $task = $result->fetch_assoc();
        $stmt->close();
        
        // Debug current task state
        error_log("Task details: " . json_encode($task));
        
        // Check if task is already assigned
        $currentAssignee = trim($task['assignee'] ?? '');
        if (!empty($currentAssignee)) {
            respond(["success" => false, "message" => "Task already assigned to: " . $currentAssignee]);
        }
        
        // Check if status allows assignment
        $currentStatus = $task['status'] ?? '';
        if (!empty($currentStatus) && !in_array($currentStatus, ['open', ''], true)) {
            respond(["success" => false, "message" => "Task not available. Current status: " . $currentStatus]);
        }
        
        // Update task with prepared statement - more permissive condition
        $updateSql = "UPDATE tasks SET assignee = ?, status = 'in_progress' WHERE id = ? AND (assignee IS NULL OR assignee = '' OR assignee = 'null')";
        $updateStmt = $conn->prepare($updateSql);
        if (!$updateStmt) {
            respond(["success" => false, "message" => "Database error: " . $conn->error]);
        }
        
        $updateStmt->bind_param("si", $currentUser, $taskId);
        $success = $updateStmt->execute();
        $affectedRows = $updateStmt->affected_rows;
        
        // Log the SQL query for debugging
        error_log("SQL Query: UPDATE tasks SET assignee = '$currentUser', status = 'in_progress' WHERE id = $taskId AND (assignee IS NULL OR assignee = '' OR assignee = 'null')");
        error_log("Current user: " . $currentUser);
        
        $updateStmt->close();
        
        error_log("Update result - Success: " . ($success ? 'true' : 'false') . ", Affected rows: " . $affectedRows);
        
        if ($success && $affectedRows > 0) {
            // Fetch the updated task to return to frontend
            $fetchSql = "SELECT * FROM tasks WHERE id = ?";
            $fetchStmt = $conn->prepare($fetchSql);
            $fetchStmt->bind_param("i", $taskId);
            $fetchStmt->execute();
            $result = $fetchStmt->get_result();
            $updatedTask = $result->fetch_assoc();
            $fetchStmt->close();
            
            error_log("Updated task retrieved: " . json_encode($updatedTask));
            error_log("========================");
            
            // Ensure tags are properly formatted
            if ($updatedTask) {
                $updatedTask['tags'] = $updatedTask['tags'] ? explode(",", $updatedTask['tags']) : [];
            }
            
            respond([
                "success" => true, 
                "message" => "Task accepted successfully",
                "task" => $updatedTask,
                "debug_info" => [
                    "affected_rows" => $affectedRows,
                    "task_id" => $taskId,
                    "current_user" => $currentUser
                ]
            ]);
        } else {
            error_log("Update failed - Success: " . ($success ? 'true' : 'false') . ", Affected rows: " . $affectedRows);
            error_log("========================");
            respond(["success" => false, "message" => "Failed to accept task. It may have been assigned to someone else.", "debug_info" => ["affected_rows" => $affectedRows, "sql_success" => $success]]);
        }
    }

    // Complete a task → move to Completed
    if ($action === "complete") {
        // Debug logging
        error_log("=== COMPLETE TASK DEBUG ===");
        error_log("Task ID: " . $taskId);
        error_log("Current User: " . $currentUser);
        
        // Sanitize task ID
        $taskId = intval($taskId);
        if ($taskId <= 0) {
            respond(["success" => false, "message" => "Invalid task ID"]);
        }
        
        // Update task status to completed using prepared statement
        $sql = "UPDATE tasks SET status = 'completed' WHERE id = ? AND assignee = ? AND status = 'in_progress'";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            respond(["success" => false, "message" => "Database error: " . $conn->error]);
        }
        
        $stmt->bind_param("is", $taskId, $currentUser);
        $success = $stmt->execute();
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        
        error_log("Complete result - Success: " . ($success ? 'true' : 'false') . ", Affected rows: " . $affectedRows);
        error_log("==========================");
        
        if ($success && $affectedRows > 0) {
            respond(["success" => true, "message" => "Task marked completed"]);
        } else {
            respond(["success" => false, "message" => "Task not found, not assigned to you, or not in progress"]);
        }
    }

    // If we reach here, no valid action was found
    respond(["success" => false, "message" => "Invalid action: " . $action]);
}

// Default response
respond(["success" => false, "message" => "Invalid request"]);
?>
