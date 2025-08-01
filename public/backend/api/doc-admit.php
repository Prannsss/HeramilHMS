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
        
        // Update room status if room information is provided and not N/A
        if ($floor_number !== 'N/A' && $room_number !== 'N/A') {
            // Find the room by floor and room number
            $room_stmt = $conn->prepare("SELECT room_id, status FROM rooms WHERE floor = ? AND room_number = ?");
            $room_stmt->bind_param("is", $floor_number, $room_number);
            $room_stmt->execute();
            $room_result = $room_stmt->get_result();
            
            if ($room_result->num_rows > 0) {
                $room_data = $room_result->fetch_assoc();
                $room_id = $room_data['room_id'];
                $current_status = $room_data['status'];
                
                // Check if room is available
                if ($current_status === 'Vacant') {
                    // Update room to occupied and assign patient
                    $update_room_stmt = $conn->prepare("UPDATE rooms SET status = 'Occupied', patient_id = ? WHERE room_id = ?");
                    $update_room_stmt->bind_param("ii", $patient_id, $room_id);
                    
                    if (!$update_room_stmt->execute()) {
                        throw new Exception("Failed to update room status");
                    }
                } else {
                    // Room is not vacant, but continue with admission - just log it
                    error_log("Warning: Room $room_number on floor $floor_number is not vacant but patient was assigned to it");
                }
            } else {
                // Room doesn't exist, but continue with admission - just log it
                error_log("Warning: Room $room_number on floor $floor_number does not exist in rooms table");
            }
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
