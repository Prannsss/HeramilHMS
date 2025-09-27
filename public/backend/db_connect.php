<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

if (!headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "heramildb";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    
    if (basename($_SERVER['PHP_SELF']) == 'db_connect.php') {
        echo json_encode([
            "status" => "error", 
            "message" => "Database connection failed"
        ]);
    }
    exit;
}

$conn->set_charset("utf8");

if (basename($_SERVER['PHP_SELF']) == 'db_connect.php') {
    echo json_encode([
        "status" => "success", 
        "message" => "Database connected successfully"
    ]);
}
?>