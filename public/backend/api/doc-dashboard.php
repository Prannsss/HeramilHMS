<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection and auth helpers
require_once '../db_connect.php';
require_once 'auth_helpers.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            handleGet($conn);
            break;
        case 'POST':
            handlePost($conn);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

function handleGet($conn) {
    try {
        // Get doctor ID from authentication
        $doctor_id = getDoctorIdFromAuth();
        
        if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: Invalid or missing doctor authentication']);
            return;
        }
        
        // Get current date for filtering today's appointments
        $today = date('Y-m-d');
        
        // Fetch doctor information
        $doctor_query = "SELECT name, specialization, department FROM doctors WHERE doctor_id = ?";
        $doctor_stmt = $conn->prepare($doctor_query);
        $doctor_stmt->bind_param("i", $doctor_id);
        $doctor_stmt->execute();
        $doctor_result = $doctor_stmt->get_result();
        $doctor_info = $doctor_result->fetch_assoc();
        
        if (!$doctor_info) {
            throw new Exception("Doctor not found");
        }
        
        // Fetch upcoming verified appointments for the doctor (not just today, excluding automatic admission appointments)
        $appointments_query = "
            SELECT 
                a.appointment_id,
                a.appointment_datetime,
                a.reason,
                a.status,
                p.name as patient_name,
                p.contact_number as patient_contact,
                p.address as patient_address
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = ? 
            AND a.appointment_datetime >= NOW()
            AND a.status = 'Scheduled'
            AND a.reason NOT LIKE 'Initial consultation -%'
            ORDER BY a.appointment_datetime ASC
        ";
        
        $appointments_stmt = $conn->prepare($appointments_query);
        $appointments_stmt->bind_param("i", $doctor_id);
        $appointments_stmt->execute();
        $appointments_result = $appointments_stmt->get_result();
        
        $appointments = [];
        while ($row = $appointments_result->fetch_assoc()) {
            $appointment_date = date('Y-m-d', strtotime($row['appointment_datetime']));
            $appointment_time = date('h:i A', strtotime($row['appointment_datetime']));
            
            // Generate email from name if contact is just a phone number
            $email = $row['patient_contact'];
            if (preg_match('/^[\d\s\-\+\(\)]+$/', $email)) {
                // If it's just a phone number, generate an email
                $email = strtolower(str_replace(' ', '.', $row['patient_name'])) . '@email.com';
            }
            
            $appointments[] = [
                'id' => 'APP' . str_pad($row['appointment_id'], 3, '0', STR_PAD_LEFT),
                'patient' => [
                    'name' => $row['patient_name'],
                    'email' => $email
                ],
                'time' => $appointment_time,
                'reason' => $row['reason'],
                'date' => $appointment_date
            ];
        }
        
        // Fetch patients who have appointments with this specific doctor (including those assigned during admission)
        $patients_query = "
            SELECT DISTINCT
                p.patient_id,
                p.name,
                p.age,
                p.contact_number,
                p.address,
                p.date_of_birth,
                p.blood_type,
                p.allergies,
                p.gender,
                p.date_of_admission,
                p.reason_for_admission,
                p.date_of_discharge,
                p.status,
                COALESCE(MAX(a.appointment_datetime), p.date_of_admission) as last_appointment
            FROM patients p
            INNER JOIN appointments a ON p.patient_id = a.patient_id
            WHERE a.doctor_id = ?
            AND (p.status = 'Active' OR p.status = 'Admitted')
            AND (a.status = 'Scheduled' OR a.status = 'Completed')
            GROUP BY p.patient_id
            ORDER BY last_appointment DESC, p.date_of_admission DESC
            LIMIT 20
        ";
        
        $patients_stmt = $conn->prepare($patients_query);
        $patients_stmt->bind_param("i", $doctor_id);
        $patients_stmt->execute();
        $patients_result = $patients_stmt->get_result();
        $patients = [];
        
        while ($row = $patients_result->fetch_assoc()) {
            // Generate email from contact if it's a phone number
            $email = $row['contact_number'];
            if (preg_match('/^[\d\s\-\+\(\)]+$/', $email)) {
                $email = strtolower(str_replace(' ', '.', $row['name'])) . '@email.com';
            }
            
            $patients[] = [
                'id' => $row['patient_id'],
                'patient_id' => (int) $row['patient_id'],
                'name' => $row['name'],
                'email' => $email,
                'age' => (int) ($row['age'] ?: 0),
                'contact_number' => $row['contact_number'],
                'address' => $row['address'],
                'dob' => $row['date_of_birth'],
                'gender' => $row['gender'] ?: 'Not specified',
                'lastVisit' => $row['date_of_admission'],
                'status' => $row['status'],
                'bloodType' => $row['blood_type'] ?: 'Not specified',
                'allergies' => $row['allergies'] ?: 'None',
                'dateOfAdmission' => $row['date_of_admission'],
                'reasonForAdmission' => $row['reason_for_admission'],
                'dateOfDischarge' => $row['date_of_discharge']
            ];
        }
        
        // Return all data in a single response
        echo json_encode([
            'success' => true,
            'data' => [
                'doctor' => $doctor_info,
                'appointments' => $appointments,
                'patients' => $patients,
                'today' => $today
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch dashboard data: ' . $e->getMessage()]);
    }
}

function handlePost($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            return;
        }
        
        // Handle saving diagnosis notes
        if (isset($input['action']) && $input['action'] === 'save_notes') {
            $required_fields = ['patient_id', 'notes'];
            foreach ($required_fields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }
            
            // Get doctor ID from authentication or input
            $doctor_id = isset($input['doctor_id']) ? intval($input['doctor_id']) : getDoctorIdFromAuth();
            
            if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized: Invalid or missing doctor authentication']);
                return;
            }
            
            // Verify that the patient has an appointment with this doctor (security check)
            $verify_stmt = $conn->prepare("
                SELECT COUNT(*) as count 
                FROM appointments 
                WHERE patient_id = ? AND doctor_id = ? 
                AND (status = 'Scheduled' OR status = 'Completed')
            ");
            $verify_stmt->bind_param("ii", $input['patient_id'], $doctor_id);
            $verify_stmt->execute();
            $verify_result = $verify_stmt->get_result();
            $verify_row = $verify_result->fetch_assoc();
            
            if ($verify_row['count'] == 0) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied: This patient is not assigned to you']);
                return;
            }
            
            // Insert diagnosis note into medical_records table
            $record_date = date('Y-m-d');
            $record_type = 'Diagnosis';
            
            $stmt = $conn->prepare("
                INSERT INTO medical_records (patient_id, doctor_id, record_date, record_type, details) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "iisss", 
                $input['patient_id'], 
                $doctor_id,
                $record_date, 
                $record_type, 
                $input['notes']
            );
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Diagnosis notes saved successfully',
                    'record_id' => $conn->insert_id
                ]);
            } else {
                throw new Exception("Failed to save diagnosis notes: " . $stmt->error);
            }
        }
        // Handle updating patient information
        elseif (isset($input['action']) && $input['action'] === 'update_patient') {
            $required_fields = ['patient_id'];
            foreach ($required_fields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }
            
            // Get doctor ID from authentication or input
            $doctor_id = isset($input['doctor_id']) ? intval($input['doctor_id']) : getDoctorIdFromAuth();
            
            if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized: Invalid or missing doctor authentication']);
                return;
            }
            
            // Verify that the patient has an appointment with this doctor (security check)
            $verify_stmt = $conn->prepare("
                SELECT COUNT(*) as count 
                FROM appointments 
                WHERE patient_id = ? AND doctor_id = ? 
                AND (status = 'Scheduled' OR status = 'Completed')
            ");
            $verify_stmt->bind_param("ii", $input['patient_id'], $doctor_id);
            $verify_stmt->execute();
            $verify_result = $verify_stmt->get_result();
            $verify_row = $verify_result->fetch_assoc();
            
            if ($verify_row['count'] == 0) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied: This patient is not assigned to you']);
                return;
            }
            
            // Build update query dynamically based on provided fields
            $update_fields = [];
            $bind_types = "";
            $bind_values = [];
            
            // Define allowed fields that doctors can update
            $allowed_fields = [
                'name' => 's',
                'contact_number' => 's', 
                'address' => 's',
                'date_of_birth' => 's',
                'age' => 'i',
                'blood_type' => 's',
                'allergies' => 's',
                'gender' => 's'
            ];
            
            foreach ($allowed_fields as $field => $type) {
                if (isset($input[$field])) {
                    $update_fields[] = "$field = ?";
                    $bind_types .= $type;
                    $bind_values[] = $input[$field];
                }
            }
            
            if (empty($update_fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid fields provided for update']);
                return;
            }
            
            // Add patient_id to bind values for WHERE clause
            $bind_types .= "i";
            $bind_values[] = $input['patient_id'];
            
            $update_query = "UPDATE patients SET " . implode(', ', $update_fields) . " WHERE patient_id = ?";
            
            $stmt = $conn->prepare($update_query);
            $stmt->bind_param($bind_types, ...$bind_values);
            
            if ($stmt->execute()) {
                // Fetch updated patient data
                $patient_stmt = $conn->prepare("
                    SELECT patient_id, name, age, contact_number, address, date_of_birth, 
                           blood_type, allergies, gender, status
                    FROM patients 
                    WHERE patient_id = ?
                ");
                $patient_stmt->bind_param("i", $input['patient_id']);
                $patient_stmt->execute();
                $patient_result = $patient_stmt->get_result();
                $updated_patient = $patient_result->fetch_assoc();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Patient information updated successfully',
                    'patient' => $updated_patient
                ]);
            } else {
                throw new Exception("Failed to update patient information: " . $stmt->error);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action or missing action parameter']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save notes: ' . $e->getMessage()]);
    }
}

$conn->close();
?>
