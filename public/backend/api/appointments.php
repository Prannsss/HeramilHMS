<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get all appointments with patient and doctor information
        $appointments_query = "
            SELECT 
                a.appointment_id,
                a.appointment_datetime,
                a.reason,
                a.status,
                p.name as patient_name,
                p.contact_number as patient_contact,
                p.address as patient_address,
                d.name as doctor_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.doctor_id
            ORDER BY a.appointment_datetime DESC
        ";
        
        $appointments_result = $conn->query($appointments_query);
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
            $ui_status = 'Requests'; // Default
            switch ($row['status']) {
                case 'Scheduled':
                    $ui_status = 'Verified';
                    break;
                case 'Completed':
                    $ui_status = 'Verified';
                    break;
                case 'Cancelled':
                    $ui_status = 'Rejected';
                    break;
                case 'Pending':
                default:
                    $ui_status = 'Requests';
                    break;
            }
            
            $appointments[] = [
                'id' => 'APP' . str_pad($row['appointment_id'], 3, '0', STR_PAD_LEFT),
                'patient' => [
                    'name' => $row['patient_name'],
                    'email' => $email,
                    'mobile' => $row['patient_contact'],
                    'address' => $row['patient_address']
                ],
                'doctor' => $row['doctor_name'],
                'date' => $appointment_date,
                'time' => $appointment_time,
                'reason' => $row['reason'],
                'status' => $ui_status,
                'db_status' => $row['status'], // Keep original status for backend operations
                'appointment_id' => $row['appointment_id'] // Keep original ID for backend operations
            ];
        }
        
        echo json_encode([
            'status' => 'success',
            'data' => $appointments
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to fetch appointments: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required_fields = ['name', 'email', 'mobile', 'address', 'date', 'time', 'doctorId', 'reason'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                echo json_encode([
                    'status' => 'error',
                    'message' => "Field '$field' is required"
                ]);
                exit;
            }
        }
        
        // Check if patient exists, if not create one
        $patient_query = "SELECT patient_id FROM patients WHERE contact_number = ?";
        $stmt = $conn->prepare($patient_query);
        $stmt->bind_param("s", $input['mobile']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Patient exists, get the ID
            $patient = $result->fetch_assoc();
            $patient_id = $patient['patient_id'];
            
            // Update patient information
            $update_patient_query = "UPDATE patients SET name = ?, contact_number = ?, address = ? WHERE patient_id = ?";
            $stmt = $conn->prepare($update_patient_query);
            $stmt->bind_param("sssi", $input['name'], $input['mobile'], $input['address'], $patient_id);
            $stmt->execute();
        } else {
            // Create new patient with only basic contact information
            $insert_patient_query = "INSERT INTO patients (name, contact_number, address) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($insert_patient_query);
            $stmt->bind_param("sss", $input['name'], $input['mobile'], $input['address']);
            
            if ($stmt->execute()) {
                $patient_id = $conn->insert_id;
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to create patient record'
                ]);
                exit;
            }
        }
        
        // Extract doctor ID (remove 'STF' prefix if present and convert to integer)
        $doctor_id = $input['doctorId'];
        if (strpos($doctor_id, 'STF') === 0) {
            $doctor_id = (int)substr($doctor_id, 3);
        } else {
            $doctor_id = (int)$doctor_id;
        }
        
        // Combine date and time for appointment_datetime
        $appointment_datetime = $input['date'] . ' ' . date('H:i:s', strtotime($input['time']));
        
        // Create appointment
        $insert_appointment_query = "INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, reason, status) VALUES (?, ?, ?, ?, 'Pending')";
        $stmt = $conn->prepare($insert_appointment_query);
        $stmt->bind_param("iiss", $patient_id, $doctor_id, $appointment_datetime, $input['reason']);
        
        if ($stmt->execute()) {
            $appointment_id = $conn->insert_id;
            echo json_encode([
                'status' => 'success',
                'message' => 'Appointment created successfully',
                'appointment_id' => $appointment_id
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to create appointment: ' . $stmt->error
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create appointment: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $appointment_id = $input['appointment_id'];
        $new_status = $input['status'];
        
        // Map UI status to database status
        $db_status = 'Pending'; // Default
        switch ($new_status) {
            case 'Verified':
                $db_status = 'Scheduled';
                break;
            case 'Rejected':
                $db_status = 'Cancelled';
                break;
            case 'Requests':
                $db_status = 'Pending';
                break;
        }
        
        $update_query = "UPDATE appointments SET status = ? WHERE appointment_id = ?";
        $stmt = $conn->prepare($update_query);
        $stmt->bind_param("si", $db_status, $appointment_id);
        
        if ($stmt->execute()) {
            // If appointment is verified (scheduled), mark the patient as active for appointments
            // but do not auto-fill medical details - those will be filled by the doctor
            if ($db_status === 'Scheduled') {
                $patient_update_query = "
                    UPDATE patients 
                    SET status = 'Active' 
                    WHERE patient_id = (
                        SELECT patient_id FROM appointments WHERE appointment_id = ?
                    )
                ";
                $patient_stmt = $conn->prepare($patient_update_query);
                $patient_stmt->bind_param("i", $appointment_id);
                $patient_stmt->execute();
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Appointment status updated successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update appointment status'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update appointment: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $appointment_id = $input['appointment_id'];
        
        $delete_query = "DELETE FROM appointments WHERE appointment_id = ?";
        $stmt = $conn->prepare($delete_query);
        $stmt->bind_param("i", $appointment_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Appointment deleted successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to delete appointment'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to delete appointment: ' . $e->getMessage()
        ]);
    }
}

$conn->close();
?>
