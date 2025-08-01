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
        case 'PUT':
            handlePut($conn);
            break;
        case 'DELETE':
            handleDelete($conn);
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
        
        // Fetch all appointments for the doctor
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
            ORDER BY a.appointment_datetime DESC
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
            
            // Map database status to UI status
            $ui_status = 'Upcoming'; // Default
            switch ($row['status']) {
                case 'Completed':
                    $ui_status = 'Done';
                    break;
                case 'Cancelled':
                    $ui_status = 'Rejected';
                    break;
                case 'Scheduled':
                case 'Pending':
                default:
                    $ui_status = 'Upcoming';
                    break;
            }
            
            $appointments[] = [
                'id' => 'APP' . str_pad($row['appointment_id'], 3, '0', STR_PAD_LEFT),
                'patient' => [
                    'name' => $row['patient_name'],
                    'email' => $email
                ],
                'date' => $appointment_date,
                'time' => $appointment_time,
                'reason' => $row['reason'],
                'status' => $ui_status,
                'db_status' => $row['status'], // Keep original status for backend operations
                'appointment_id' => $row['appointment_id'] // Keep original ID for backend operations
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $appointments
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch appointments: ' . $e->getMessage()]);
    }
}

function handlePut($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['appointment_id']) || !isset($input['status'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing appointment_id or status']);
            return;
        }
        
        // Extract numeric appointment ID from the UI ID (APP001 -> 1)
        $appointment_id = $input['appointment_id'];
        if (strpos($appointment_id, 'APP') === 0) {
            $appointment_id = (int) substr($appointment_id, 3);
        }
        
        // Map UI status to database status
        $db_status = $input['status'];
        switch ($input['status']) {
            case 'Done':
                $db_status = 'Completed';
                break;
            case 'Rejected':
                $db_status = 'Cancelled';
                break;
            case 'Upcoming':
                $db_status = 'Scheduled';
                break;
        }
        
        // Update appointment status
        $stmt = $conn->prepare("UPDATE appointments SET status = ? WHERE appointment_id = ?");
        $stmt->bind_param("si", $db_status, $appointment_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Appointment status updated successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Appointment not found']);
            }
        } else {
            throw new Exception("Failed to update appointment: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update appointment: ' . $e->getMessage()]);
    }
}

function handleDelete($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['appointment_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing appointment_id']);
            return;
        }
        
        // Extract numeric appointment ID from the UI ID (APP001 -> 1)
        $appointment_id = $input['appointment_id'];
        if (strpos($appointment_id, 'APP') === 0) {
            $appointment_id = (int) substr($appointment_id, 3);
        }
        
        // Delete the appointment
        $stmt = $conn->prepare("DELETE FROM appointments WHERE appointment_id = ?");
        $stmt->bind_param("i", $appointment_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Appointment deleted successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Appointment not found']);
            }
        } else {
            throw new Exception("Failed to delete appointment: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete appointment: ' . $e->getMessage()]);
    }
}

$conn->close();
?>
