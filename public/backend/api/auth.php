<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include("../db_connect.php");

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data["email"]) || empty($data["password"])) {
    echo json_encode(["status" => "error", "message" => "Email and password are required."]);
    exit;
}

$email = $data["email"];
$password = $data["password"];
$password_hash = hash("sha256", $password); 

$stmt = $conn->prepare("SELECT user_id, role, email FROM users WHERE email = ? AND password_hash = ?");
$stmt->bind_param("ss", $email, $password_hash);
$stmt->execute();
$result = $stmt->get_result();

// Return response
if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    $response_user = [
        "id" => $user["user_id"],
        "role" => $user["role"],
        "email" => $user["email"]
    ];
    
    // If user is a Doctor, also get the doctor_id and other doctor details
    if ($user["role"] === "Doctor") {
        $doctor_stmt = $conn->prepare("SELECT doctor_id, name, specialization, department FROM doctors WHERE user_id = ? AND status = 'Active'");
        $doctor_stmt->bind_param("i", $user["user_id"]);
        $doctor_stmt->execute();
        $doctor_result = $doctor_stmt->get_result();
        
        if ($doctor_result && $doctor_result->num_rows === 1) {
            $doctor = $doctor_result->fetch_assoc();
            $response_user["doctor_id"] = $doctor["doctor_id"];
            $response_user["name"] = $doctor["name"];
            $response_user["specialization"] = $doctor["specialization"];
            $response_user["department"] = $doctor["department"];
        }
        $doctor_stmt->close();
    } else if ($user["role"] === "Admin") {
        $response_user["name"] = "Administrator";
    }
    
    echo json_encode([
        "status" => "success",
        "message" => "Login successful.",
        "user" => $response_user
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>