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
    // Handle patient admission
    $doctor_id = 1; // TODO: Get from session/authentication
    $patient_id = $_POST['patient_id'] ?? null;
    $date_of_birth = $_POST['date_of_birth'] ?? null;
    $blood_type = $_POST['blood_type'] ?? null;
    $allergies = $_POST['allergies'] ?? null;
    $admission_date = $_POST['admission_date'] ?? date('Y-m-d');
    $reason_for_admission = $_POST['reason_for_admission'] ?? null;
    $floor_number = $_POST['floor_number'] ?? 'N/A';
    $room_number = $_POST['room_number'] ?? 'N/A';
    $attending_doctor = $_POST['attending_doctor'] ?? $doctor_id;
    
    // Convert admission_date to just date format (remove time if present)
    if (strpos($admission_date, ' ') !== false) {
        $admission_date = explode(' ', $admission_date)[0];
    }
    
    if (!$patient_id || !$date_of_birth || !$reason_for_admission) {
        ob_clean();
        echo json_encode([
            'status' => 'error',
            'message' => 'Patient ID, date of birth, and reason for admission are required'
        ]);
        exit;
    }
    
    try {
        $conn->begin_transaction();
        
        // Update patient with medical details
        $stmt = $conn->prepare("UPDATE patients SET 
            date_of_birth = ?, 
            blood_type = ?, 
            allergies = ?, 
            date_of_admission = ?, 
            reason_for_admission = ?,
            floor_number = ?,
            room_number = ?,
            status = 'Admitted'
            WHERE patient_id = ?");
        $stmt->bind_param("sssssssi", 
            $date_of_birth, 
            $blood_type, 
            $allergies, 
            $admission_date, 
            $reason_for_admission,
            $floor_number,
            $room_number, 
            $patient_id
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update patient admission details");
        }
        
        // Create admission record in medical_records
        $stmt = $conn->prepare("INSERT INTO medical_records 
            (patient_id, doctor_id, record_date, record_type, details) 
            VALUES (?, ?, ?, ?, ?)");
        $diagnosis = "Patient Admitted";
        $treatment = "Admitted for: " . $reason_for_admission;
        $notes = "Patient admitted on " . $admission_date . " by Dr. " . $attending_doctor;
        $record_type = "Admission";
        $details = $treatment . ". " . $notes;
        
        $stmt->bind_param("iisss", 
            $patient_id, 
            $attending_doctor, 
            date('Y-m-d'), 
            $record_type,
            $details
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create admission record");
        }
        
        $conn->commit();
        
        // Clear any buffered output and send JSON success response
        ob_clean();
        echo json_encode([
            'status' => 'success',
            'message' => 'Patient admitted successfully'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        // Clear any buffered output and send JSON error response
        ob_clean();
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to admit patient: ' . $e->getMessage()
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
