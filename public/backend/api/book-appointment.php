<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../db_connect.php';

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch doctors and departments data
        getDoctorsData();
        break;
    case 'POST':
        // Create new appointment
        createAppointment();
        break;
    default:
        http_response_code(405);
        echo json_encode([
            "status" => "error",
            "message" => "Method not allowed"
        ]);
        break;
}

function getDoctorsData() {
    global $conn;
    
    try {
        // Get all active doctors with their departments
        $doctorsQuery = "
            SELECT 
                doctor_id as id, 
                name, 
                department, 
                specialization,
                status
            FROM doctors 
            WHERE status = 'Active' 
            ORDER BY department, name
        ";
        
        $doctorsResult = $conn->query($doctorsQuery);
        
        if (!$doctorsResult) {
            throw new Exception("Error fetching doctors: " . $conn->error);
        }
        
        $doctors = [];
        $departments = [];
        $doctors_by_department = [];
        
        while ($row = $doctorsResult->fetch_assoc()) {
            // Add available times (you can modify this based on your scheduling system)
            $row['availableTimes'] = [
                '09:00 AM', '10:00 AM', '11:00 AM', 
                '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
            ];
            
            $doctors[] = $row;
            
            // Collect unique departments
            if (!in_array($row['department'], $departments)) {
                $departments[] = $row['department'];
            }
            
            // Group doctors by department
            if (!isset($doctors_by_department[$row['department']])) {
                $doctors_by_department[$row['department']] = [];
            }
            $doctors_by_department[$row['department']][] = $row;
        }
        
        // Sort departments alphabetically
        sort($departments);
        
        echo json_encode([
            "status" => "success",
            "data" => [
                "doctors" => $doctors,
                "departments" => $departments,
                "doctors_by_department" => $doctors_by_department
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error in getDoctorsData: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Failed to fetch doctors data: " . $e->getMessage()
        ]);
    }
}

function createAppointment() {
    global $conn;
    
    try {
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception("Invalid JSON input");
        }
        
        // Validate required fields
        $required_fields = ['name', 'email', 'mobile', 'address', 'date', 'time', 'doctorId', 'reason'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                throw new Exception("Missing required field: $field");
            }
        }
        
        // Sanitize inputs
        $name = trim($input['name']);
        $email = trim($input['email']);
        $mobile = trim($input['mobile']);
        $address = trim($input['address']);
        $date = trim($input['date']);
        $time = trim($input['time']);
        $doctorId = intval($input['doctorId']);
        $reason = trim($input['reason']);
        
        // Validate doctorId is a valid integer
        if ($doctorId <= 0) {
            throw new Exception("Invalid doctor ID: " . $input['doctorId']);
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        // Validate date format (YYYY-MM-DD)
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new Exception("Invalid date format. Use YYYY-MM-DD");
        }
        
        // Validate that the date is not in the past
        if (strtotime($date) < strtotime(date('Y-m-d'))) {
            throw new Exception("Appointment date cannot be in the past");
        }
        
        // Check if doctor exists and is active
        $doctorCheckQuery = "SELECT doctor_id, name FROM doctors WHERE doctor_id = ? AND status = 'Active'";
        $doctorStmt = $conn->prepare($doctorCheckQuery);
        $doctorStmt->bind_param("i", $doctorId);
        $doctorStmt->execute();
        $doctorResult = $doctorStmt->get_result();
        
        if ($doctorResult->num_rows === 0) {
            throw new Exception("Selected doctor is not available");
        }
        
        $doctor = $doctorResult->fetch_assoc();
        
        // Start transaction
        $conn->begin_transaction();
        
        // First, create or get patient record
        $patientId = createOrGetPatient($name, $email, $mobile, $address, $reason);
        
        // Create appointment datetime
        $appointmentDateTime = $date . ' ' . convertTo24Hour($time);
        
        // Check for appointment conflicts
        $conflictQuery = "
            SELECT appointment_id 
            FROM appointments 
            WHERE doctor_id = ? 
            AND appointment_datetime = ? 
            AND status IN ('Scheduled', 'Pending')
        ";
        $conflictStmt = $conn->prepare($conflictQuery);
        $conflictStmt->bind_param("is", $doctorId, $appointmentDateTime);
        $conflictStmt->execute();
        $conflictResult = $conflictStmt->get_result();
        
        if ($conflictResult->num_rows > 0) {
            throw new Exception("This time slot is already booked. Please select a different time.");
        }
        
        // Insert appointment
        $appointmentQuery = "
            INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, reason, status) 
            VALUES (?, ?, ?, ?, 'Pending')
        ";
        $appointmentStmt = $conn->prepare($appointmentQuery);
        $appointmentStmt->bind_param("iiss", $patientId, $doctorId, $appointmentDateTime, $reason);
        
        if (!$appointmentStmt->execute()) {
            throw new Exception("Failed to create appointment: " . $conn->error);
        }
        
        $appointmentId = $conn->insert_id;
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            "status" => "success",
            "message" => "Appointment created successfully",
            "data" => [
                "appointment_id" => $appointmentId,
                "patient_id" => $patientId,
                "doctor_name" => $doctor['name'],
                "appointment_datetime" => $appointmentDateTime,
                "status" => "Pending"
            ]
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        
        error_log("Error in createAppointment: " . $e->getMessage());
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}

function createOrGetPatient($name, $email, $mobile, $address, $reasonForAppointment) {
    global $conn;
    
    // Check if patient already exists by email or mobile
    $checkQuery = "SELECT patient_id FROM patients WHERE contact_number = ? OR name = ? LIMIT 1";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("ss", $mobile, $name);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        // Patient exists, update their reason for appointment
        $patient = $result->fetch_assoc();
        $patientId = $patient['patient_id'];
        
        // Update the reason for appointment
        $updateQuery = "UPDATE patients SET reason_for_appointment = ? WHERE patient_id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bind_param("si", $reasonForAppointment, $patientId);
        $updateStmt->execute();
        
        return $patientId;
    }
    
    // Create new patient
    $insertQuery = "
        INSERT INTO patients (name, contact_number, address, status, date_of_admission, reason_for_admission, reason_for_appointment) 
        VALUES (?, ?, ?, 'Active', CURDATE(), 'Appointment booking', ?)
    ";
    $insertStmt = $conn->prepare($insertQuery);
    $insertStmt->bind_param("ssss", $name, $mobile, $address, $reasonForAppointment);
    
    if (!$insertStmt->execute()) {
        throw new Exception("Failed to create patient record: " . $conn->error);
    }
    
    return $conn->insert_id;
}

function convertTo24Hour($time12h) {
    // Convert 12-hour format to 24-hour format
    return date("H:i:s", strtotime($time12h));
}
?>
