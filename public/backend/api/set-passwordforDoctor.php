<?php
require_once '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$raw_input = file_get_contents('php://input');
error_log("Raw input: " . $raw_input);

try {
    $input = json_decode($raw_input, true);
    
    error_log("Parsed input: " . json_encode($input));
    
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input. Raw input was: ' . $raw_input]);
        exit();
    }
    
    if ((!isset($input['doctor_id']) && !isset($input['id'])) || !isset($input['password'])) {
        echo json_encode(['success' => false, 'error' => 'Doctor ID and password are required. Received keys: ' . implode(', ', array_keys($input))]);
        exit();
    }
    
    $doctor_id_input = $input['doctor_id'] ?? $input['id'];
    $password = trim($input['password']);
    
    if (is_string($doctor_id_input) && preg_match('/^STF(\d+)$/', $doctor_id_input, $matches)) {
        $doctor_id = intval($matches[1]);
    } else {
        $doctor_id = intval($doctor_id_input);
    }
    
    error_log("Input doctor_id: " . $doctor_id_input . ", processed numeric doctor_id: " . $doctor_id . ", password length: " . strlen($password));
    
    if ($doctor_id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid doctor ID: ' . $doctor_id_input . ' (could not extract numeric ID)']);
        exit();
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters long']);
        exit();
    }
    
    $check_doctor_query = "SELECT doctor_id, email FROM doctors WHERE doctor_id = ?";
    $check_stmt = $conn->prepare($check_doctor_query);
    
    $check_stmt->bind_param("i", $doctor_id);
    $check_stmt->execute();
    $doctor_result = $check_stmt->get_result();
    
    if ($doctor_result->num_rows === 0) {
        error_log("Doctor not found with ID: " . $doctor_id);
        echo json_encode(['success' => false, 'error' => 'Doctor not found with ID: ' . $doctor_id]);
        exit();
    }
    
    $doctor = $doctor_result->fetch_assoc();
    $doctor_email = $doctor['email'];
    
    $password_hash = hash('sha256', $password);
    
    $check_user_query = "SELECT user_id FROM users WHERE email = ?";
    $check_user_stmt = $conn->prepare($check_user_query);
    $check_user_stmt->bind_param("s", $doctor_email);
    $check_user_stmt->execute();
    $user_result = $check_user_stmt->get_result();
    
    if ($user_result->num_rows > 0) {
        $update_user_query = "UPDATE users SET password_hash = ? WHERE email = ?";
        $update_stmt = $conn->prepare($update_user_query);
        $update_stmt->bind_param("ss", $password_hash, $doctor_email);
        
        if ($update_stmt->execute()) {
            // Get the user_id and update the doctor record
            $user_row = $user_result->fetch_assoc();
            $user_id = $user_row['user_id'];
            
            $update_doctor_query = "UPDATE doctors SET user_id = ? WHERE doctor_id = ?";
            $update_doctor_stmt = $conn->prepare($update_doctor_query);
            $update_doctor_stmt->bind_param("ii", $user_id, $doctor_id);
            $update_doctor_stmt->execute();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Password updated successfully',
                'user_id' => $user_id
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to update password']);
        }
    } else {
        // User doesn't exist, create new user
        $insert_user_query = "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'Doctor')";
        $insert_stmt = $conn->prepare($insert_user_query);
        $insert_stmt->bind_param("ss", $doctor_email, $password_hash);
        
        if ($insert_stmt->execute()) {
            $user_id = $conn->insert_id;
            
            // Update the doctor record with the new user_id
            $update_doctor_query = "UPDATE doctors SET user_id = ? WHERE doctor_id = ?";
            $update_doctor_stmt = $conn->prepare($update_doctor_query);
            $update_doctor_stmt->bind_param("ii", $user_id, $doctor_id);
            $update_doctor_stmt->execute();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Password set successfully. Doctor can now log in.',
                'user_id' => $user_id
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to create user account']);
        }
    }
    
} catch (Exception $e) {
    error_log("Set password error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}

$conn->close();
?>
