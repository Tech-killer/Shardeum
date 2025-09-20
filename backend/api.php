<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Address");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Content-Type: application/json");

// DB connection
$host = "localhost";
$user = "root";   // XAMPP default user
$pass = "";       // XAMPP default password (empty)
$db   = "task_manager";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB Connection failed"]));
}

// Get HTTP method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = explode("/", trim($_SERVER['PATH_INFO'] ?? '', "/"));
$resource = $request[0] ?? '';
$id = $request[1] ?? null;

// Helper function
function respond($data) {
    echo json_encode($data);
    exit;
}

// ROUTES
if ($resource === "tasks") {
    // GET /tasks
    if ($method === "GET" && !$id) {
        $sql = "SELECT * FROM tasks ORDER BY created_at DESC";
        $result = $conn->query($sql);
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $row['tags'] = $row['tags'] ? explode(",", $row['tags']) : [];
            $tasks[] = $row;
        }
        respond(["success" => true, "tasks" => $tasks]);
    }

    // POST /tasks (create task)
    if ($method === "POST" && !$id) {
        $input = json_decode(file_get_contents("php://input"), true);
        $title = $conn->real_escape_string($input['title']);
        $description = $conn->real_escape_string($input['description']);
        $priority = $conn->real_escape_string($input['priority']);
        $category = $conn->real_escape_string($input['category']);
        $assignee = $conn->real_escape_string($input['assignee']);
        $creator = $conn->real_escape_string($input['creator']);
        $dueDate = $conn->real_escape_string($input['dueDate']);
        $estimatedHours = $conn->real_escape_string($input['estimatedHours']);
        $rewardAmount = $conn->real_escape_string($input['reward']['amount']);
        $rewardToken = $conn->real_escape_string($input['reward']['token']);
        $tags = implode(",", $input['tags']);

        $sql = "INSERT INTO tasks (title, description, priority, category, assignee, creator, due_date, estimated_hours, reward_amount, reward_token, tags)
                VALUES ('$title', '$description', '$priority', '$category', '$assignee', '$creator', '$dueDate', '$estimatedHours', '$rewardAmount', '$rewardToken', '$tags')";
        if ($conn->query($sql)) {
            respond(["success" => true, "message" => "Task created"]);
        } else {
            respond(["success" => false, "message" => $conn->error]);
        }
    }

    // PUT /tasks/{id} (update task)
    if ($method === "PUT" && $id) {
        $input = json_decode(file_get_contents("php://input"), true);
        $status = $conn->real_escape_string($input['status']);
        $sql = "UPDATE tasks SET status='$status' WHERE id=$id";
        if ($conn->query($sql)) {
            respond(["success" => true, "message" => "Task updated"]);
        } else {
            respond(["success" => false, "message" => $conn->error]);
        }
    }

    // DELETE /tasks/{id}
    if ($method === "DELETE" && $id) {
        $sql = "DELETE FROM tasks WHERE id=$id";
        if ($conn->query($sql)) {
            respond(["success" => true, "message" => "Task deleted"]);
        } else {
            respond(["success" => false, "message" => $conn->error]);
        }
    }
}

// Default response
respond(["success" => false, "message" => "Invalid endpoint"]);
?>
