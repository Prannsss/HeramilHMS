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

// Include database connection
require_once '../db_connect.php';

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
        // Get doctor ID from query parameter (default to 1 for Dr. Jayson Ado)
        $doctor_id = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 1;
        
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
        
        // Fetch upcoming verified appointments for the doctor (not just today)
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
        
        // Fetch patients who have scheduled appointments with this doctor or are active
        $patients_query = "
            SELECT DISTINCT
                p.patient_id,
                p.name,
                p.contact_number,
                p.address,
                p.date_of_birth,
                p.blood_type,
                p.allergies,
                p.date_of_admission,
                p.reason_for_admission,
                p.date_of_discharge,
                p.status,
                MAX(a.appointment_datetime) as last_appointment
            FROM patients p
            LEFT JOIN appointments a ON p.patient_id = a.patient_id AND a.doctor_id = ?
            WHERE p.status = 'Active' 
            AND (a.status = 'Scheduled' OR a.status = 'Completed' OR a.appointment_id IS NULL)
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
                'contact_number' => $row['contact_number'],
                'dob' => $row['date_of_birth'],
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
            $required_fields = ['patient_id', 'doctor_name', 'notes'];
            foreach ($required_fields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }
            
            // Get doctor ID from doctor name (assuming we have the doctor_id available)
            $doctor_id = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 1;
            
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
