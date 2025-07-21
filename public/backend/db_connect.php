<?php
// Prevent HTML output for API calls
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to output
ini_set('log_errors', 1); // Log errors instead

// CORS - only set headers if not already set by calling script
if (!headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

// Database connection configuration
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "heramildb";

// Create connection
$conn = new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    // Log error check
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