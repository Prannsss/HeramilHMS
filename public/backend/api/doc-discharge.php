<?php
// Prevent any HTML output and ensure JSON response
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to output
ini_set('log_errors', 1); // Log errors instead

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Start output buffering to catch any unexpected output
ob_start();

try {
    require_once '../db_connect.php';
    require_once 'auth_helpers.php';
} catch (Exception $e) {
    // Clear any output and send JSON error
    ob_clean();
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get doctor ID from authentication
    $doctor_id = getDoctorIdFromAuth();
    
    if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
        ob_clean();
        echo json_encode([
            'status' => 'error',
            'message' => 'Unauthorized: Invalid or missing doctor authentication'
        ]);
        exit;
    }
    $patient_id = $_POST['patient_id'] ?? null;
    $discharge_date = date('Y-m-d'); // Use date format, not datetime
    
    if (!$patient_id) {
        ob_clean();
        echo json_encode([
            'status' => 'error',
            'message' => 'Patient ID is required'
        ]);
        exit;
    }
    
    try {
        $conn->begin_transaction();
        
        // Update patient status to discharged
        $stmt = $conn->prepare("UPDATE patients SET 
            status = 'Discharged',
            date_of_discharge = ?,
            floor_number = 'N/A',
            room_number = 'N/A'
            WHERE patient_id = ?");
        $stmt->bind_param("si", $discharge_date, $patient_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update patient discharge status");
        }
        
        // Update room status to vacant and remove patient assignment
        $room_stmt = $conn->prepare("UPDATE rooms SET status = 'Vacant', patient_id = NULL WHERE patient_id = ?");
        $room_stmt->bind_param("i", $patient_id);
        
        if (!$room_stmt->execute()) {
            // Log the error but don't fail the discharge process
            error_log("Warning: Failed to update room status during patient discharge for patient_id: $patient_id");
        }
        
        // Create discharge record in medical_records
        $stmt = $conn->prepare("INSERT INTO medical_records 
            (patient_id, doctor_id, record_date, record_type, details) 
            VALUES (?, ?, ?, ?, ?)");
        $record_type = "Discharge";
        $details = "Patient discharged on " . $discharge_date;
        
        $stmt->bind_param("iisss", 
            $patient_id, 
            $doctor_id, 
            date('Y-m-d'), 
            $record_type,
            $details
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create discharge record");
        }
        
        $conn->commit();
        
        // Clear any buffered output and send JSON success response
        ob_clean();
        echo json_encode([
            'status' => 'success',
            'message' => 'Patient discharged successfully'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        // Clear any buffered output and send JSON error response
        ob_clean();
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to discharge patient: ' . $e->getMessage()
        ]);
    }
} else {
    // Clear any buffered output and send JSON error response
    ob_clean();
    echo json_encode([
        'status' => 'error',
        'message' => 'Only POST method is allowed'
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>
