<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include("../db_connect.php");

// Decode JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (empty($data["email"]) || empty($data["password"])) {
    echo json_encode(["status" => "error", "message" => "Email and password are required."]);
    exit;
}

$email = $data["email"];
$password = $data["password"];
$password_hash = hash("sha256", $password); // Match the DB hash format

// Use prepared statement to prevent SQL injection
$stmt = $conn->prepare("SELECT user_id, role FROM users WHERE email = ? AND password_hash = ?");
$stmt->bind_param("ss", $email, $password_hash);
$stmt->execute();
$result = $stmt->get_result();

// Return response
if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();
    echo json_encode([
        "status" => "success",
        "message" => "Login successful.",
        "user" => [
            "id" => $user["user_id"],
            "role" => $user["role"]
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>