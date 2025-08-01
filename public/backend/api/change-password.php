<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Only POST method is allowed'
    ]);
    exit();
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid JSON input'
        ]);
        exit();
    }
    
    // Validate required fields
    $required_fields = ['doctor_id', 'current_password', 'new_password'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => "Field '$field' is required"
            ]);
            exit();
        }
    }
    
    $doctor_id = (int) $input['doctor_id'];
    $current_password = trim($input['current_password']);
    $new_password = trim($input['new_password']);
    
    // Validate new password length
    if (strlen($new_password) < 8) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'New password must be at least 8 characters long'
        ]);
        exit();
    }
    
    // Get the user_id associated with this doctor
    $doctor_stmt = $conn->prepare("SELECT user_id FROM doctors WHERE doctor_id = ? AND status = 'Active'");
    $doctor_stmt->bind_param("i", $doctor_id);
    $doctor_stmt->execute();
    $doctor_result = $doctor_stmt->get_result();
    
    if ($doctor_result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Doctor not found or inactive'
        ]);
        exit();
    }
    
    $doctor_data = $doctor_result->fetch_assoc();
    $user_id = $doctor_data['user_id'];
    
    // Verify current password
    $current_password_hash = hash('sha256', $current_password);
    $auth_stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND password_hash = ?");
    $auth_stmt->bind_param("is", $user_id, $current_password_hash);
    $auth_stmt->execute();
    $auth_result = $auth_stmt->get_result();
    
    if ($auth_result->num_rows === 0) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Current password is incorrect'
        ]);
        exit();
    }
    
    // Hash the new password
    $new_password_hash = hash('sha256', $new_password);
    
    // Update the password in the users table
    $update_stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
    $update_stmt->bind_param("si", $new_password_hash, $user_id);
    
    if ($update_stmt->execute()) {
        if ($update_stmt->affected_rows > 0) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Password updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'No changes made to password'
            ]);
        }
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update password: ' . $update_stmt->error
        ]);
    }
    
    $update_stmt->close();
    $auth_stmt->close();
    $doctor_stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
