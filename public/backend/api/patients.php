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
        // Get all patients with their latest appointment info
        $patients_query = "
            SELECT 
                p.patient_id,
                p.name,
                p.age,
                p.gender,
                p.contact_number,
                p.address,
                p.date_of_birth,
                p.blood_type,
                p.allergies,
                p.status,
                p.date_of_admission,
                p.reason_for_admission,
                p.reason_for_appointment,
                p.floor_number,
                p.room_number,
                p.date_of_discharge,
                MAX(a.appointment_datetime) as last_visit,
                COALESCE(
                    (SELECT d2.name 
                     FROM appointments a2 
                     JOIN doctors d2 ON a2.doctor_id = d2.doctor_id 
                     WHERE a2.patient_id = p.patient_id 
                     AND a2.reason NOT LIKE 'Initial consultation -%'
                     AND a2.status IN ('Scheduled', 'Completed')
                     ORDER BY a2.appointment_datetime DESC 
                     LIMIT 1),
                    (SELECT d3.name 
                     FROM appointments a3 
                     JOIN doctors d3 ON a3.doctor_id = d3.doctor_id 
                     WHERE a3.patient_id = p.patient_id 
                     AND a3.status IN ('Scheduled', 'Completed')
                     ORDER BY a3.appointment_datetime DESC 
                     LIMIT 1)
                ) as doctor_name
            FROM patients p
            LEFT JOIN appointments a ON p.patient_id = a.patient_id
            GROUP BY p.patient_id
            ORDER BY p.patient_id DESC
        ";
        
        $patients_result = $conn->query($patients_query);
        $patients = [];
        
        while ($row = $patients_result->fetch_assoc()) {
            // Generate email from name if not exists
            $email = strtolower(str_replace(' ', '.', $row['name'])) . '@email.com';
            
            // Format last visit date
            $lastVisit = $row['last_visit'] ? date('Y-m-d', strtotime($row['last_visit'])) : null;
            
            // Get prescriptions for this patient
            $prescriptions_query = "
                SELECT details 
                FROM medical_records 
                WHERE patient_id = ? AND record_type = 'Prescription'
                ORDER BY record_date DESC
            ";
            $stmt = $conn->prepare($prescriptions_query);
            $stmt->bind_param("i", $row['patient_id']);
            $stmt->execute();
            $prescriptions_result = $stmt->get_result();
            
            $prescriptions = [];
            while ($prescription_row = $prescriptions_result->fetch_assoc()) {
                $prescriptions[] = $prescription_row['details'];
            }
            
            // Get billing information
            $bills_query = "
                SELECT 
                    bi.description,
                    bi.line_total
                FROM bills b
                JOIN bill_items bi ON b.bill_id = bi.bill_id
                WHERE b.patient_id = ?
                ORDER BY b.bill_date DESC
            ";
            $stmt = $conn->prepare($bills_query);
            $stmt->bind_param("i", $row['patient_id']);
            $stmt->execute();
            $bills_result = $stmt->get_result();
            
            $billItems = [];
            while ($bill_row = $bills_result->fetch_assoc()) {
                $billItems[] = [
                    'description' => $bill_row['description'],
                    'amount' => '₱' . number_format($bill_row['line_total'], 2)
                ];
            }
            
            $patients[] = [
                'id' => 'PAT' . str_pad($row['patient_id'], 3, '0', STR_PAD_LEFT),
                'name' => $row['name'],
                'email' => $email,
                'mobile' => $row['contact_number'] ?: 'N/A',
                'address' => $row['address'] ?: 'N/A',
                'dob' => $row['date_of_birth'] ?: 'N/A',
                'lastVisit' => $lastVisit ?: 'Never',
                'status' => $row['status'] ?: 'Active',
                'doctor' => $row['doctor_name'] ?: 'Not assigned',
                'bloodType' => $row['blood_type'] ?: 'Unknown',
                'allergies' => $row['allergies'] ?: 'None',
                'dateOfAdmission' => $row['date_of_admission'] ?: date('Y-m-d'),
                'reasonForAdmission' => $row['reason_for_admission'] ?: 'General consultation',
                'reasonForAppointment' => $row['reason_for_appointment'] ?: null,
                'floorNumber' => $row['floor_number'] ?: 'N/A',
                'roomNumber' => $row['room_number'] ?: 'N/A',
                'dateOfDischarge' => $row['date_of_discharge'],
                'prescriptions' => $prescriptions,
                'usedItems' => [], // Can be populated later if needed
                'billItems' => $billItems,
                'patient_id' => $row['patient_id'] // Keep original ID for backend operations
            ];
        }
        
        echo json_encode([
            'status' => 'success',
            'data' => $patients
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to fetch patients: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $patient_id = $input['patient_id'];
        $action = $input['action'];
        
        if ($action === 'discharge') {
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Update patient status to Discharged and set discharge date
                $discharge_query = "
                    UPDATE patients 
                    SET status = 'Discharged', 
                        date_of_discharge = CURDATE(),
                        floor_number = 'N/A',
                        room_number = 'N/A'
                    WHERE patient_id = ?
                ";
                
                $stmt = $conn->prepare($discharge_query);
                $stmt->bind_param("i", $patient_id);
                
                if (!$stmt->execute()) {
                    throw new Exception('Failed to discharge patient: ' . $stmt->error);
                }
                
                if ($stmt->affected_rows === 0) {
                    throw new Exception('Patient not found or already discharged');
                }
                
                // Update room status to vacant and remove patient assignment
                $room_update_query = "
                    UPDATE rooms 
                    SET status = 'Vacant', patient_id = NULL 
                    WHERE patient_id = ?
                ";
                $room_stmt = $conn->prepare($room_update_query);
                $room_stmt->bind_param("i", $patient_id);
                
                if (!$room_stmt->execute()) {
                    // Log the error but don't fail the discharge process
                    error_log("Warning: Failed to update room status during patient discharge for patient_id: $patient_id");
                }
                
                $conn->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Patient discharged successfully'
                ]);
                
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode([
                    'status' => 'error',
                    'message' => $e->getMessage()
                ]);
            }
        } else if ($action === 'admit') {
            // Handle patient admission with room assignment
            $floor_number = $input['floor_number'] ?? 'N/A';
            $room_number = $input['room_number'] ?? 'N/A';
            $reason_for_admission = $input['reason_for_admission'] ?? 'Admission';
            $admission_date = $input['admission_date'] ?? date('Y-m-d');
            
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Update patient status to Admitted
                $admit_query = "
                    UPDATE patients 
                    SET status = 'Admitted', 
                        date_of_admission = ?,
                        reason_for_admission = ?,
                        floor_number = ?,
                        room_number = ?,
                        date_of_discharge = NULL
                    WHERE patient_id = ?
                ";
                
                $stmt = $conn->prepare($admit_query);
                $stmt->bind_param("ssssi", $admission_date, $reason_for_admission, $floor_number, $room_number, $patient_id);
                
                if (!$stmt->execute()) {
                    throw new Exception('Failed to admit patient: ' . $stmt->error);
                }
                
                if ($stmt->affected_rows === 0) {
                    throw new Exception('Patient not found');
                }
                
                // Update room status if room information is provided and not N/A
                if ($floor_number !== 'N/A' && $room_number !== 'N/A') {
                    // Find the room by floor and room number
                    $room_query = "SELECT room_id, status FROM rooms WHERE floor = ? AND room_number = ?";
                    $room_stmt = $conn->prepare($room_query);
                    $room_stmt->bind_param("is", $floor_number, $room_number);
                    $room_stmt->execute();
                    $room_result = $room_stmt->get_result();
                    
                    if ($room_result->num_rows > 0) {
                        $room_data = $room_result->fetch_assoc();
                        $room_id = $room_data['room_id'];
                        $current_status = $room_data['status'];
                        
                        // Check if room is available or force update
                        if ($current_status === 'Vacant' || true) { // Allow override for manual admin changes
                            // Update room to occupied and assign patient
                            $update_room_query = "UPDATE rooms SET status = 'Occupied', patient_id = ? WHERE room_id = ?";
                            $update_room_stmt = $conn->prepare($update_room_query);
                            $update_room_stmt->bind_param("ii", $patient_id, $room_id);
                            
                            if (!$update_room_stmt->execute()) {
                                error_log("Warning: Failed to update room status during patient admission for patient_id: $patient_id");
                            }
                        }
                    } else {
                        error_log("Warning: Room $room_number on floor $floor_number does not exist in rooms table");
                    }
                }
                
                $conn->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Patient admitted successfully'
                ]);
                
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode([
                    'status' => 'error',
                    'message' => $e->getMessage()
                ]);
            }
        } else if ($action === 'sync_rooms') {
            // Synchronize rooms table with patient data
            try {
                // Start transaction
                $conn->begin_transaction();
                
                // Clear all room assignments first
                $clear_rooms_query = "UPDATE rooms SET status = 'Vacant', patient_id = NULL WHERE status != 'Maintenance'";
                $conn->query($clear_rooms_query);
                
                // Update patient room info to N/A for discharged patients
                $clear_discharged_query = "UPDATE patients SET floor_number = 'N/A', room_number = 'N/A' WHERE status = 'Discharged' AND (floor_number != 'N/A' OR room_number != 'N/A')";
                $conn->query($clear_discharged_query);
                
                // Reassign rooms based on admitted patients with room assignments
                $sync_query = "
                    UPDATE rooms r
                    JOIN patients p ON r.room_number = p.room_number AND r.floor = p.floor_number
                    SET r.status = 'Occupied', r.patient_id = p.patient_id
                    WHERE p.status = 'Admitted' 
                    AND p.floor_number != 'N/A' 
                    AND p.room_number != 'N/A'
                    AND r.status = 'Vacant'
                ";
                $conn->query($sync_query);
                
                $conn->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Room synchronization completed successfully'
                ]);
                
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to synchronize rooms: ' . $e->getMessage()
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid action specified'
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update patient: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required_fields = ['name', 'age', 'gender', 'contact_number', 'address', 'date_of_birth', 'blood_type', 'floor_number', 'room_number', 'reason_for_admission'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => "Missing required field: $field"
                ]);
                exit;
            }
        }
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Insert new patient with Admitted status by default
            $insert_query = "
                INSERT INTO patients (
                    name, age, gender, contact_number, address, date_of_birth, 
                    blood_type, allergies, status, date_of_admission, 
                    reason_for_admission, floor_number, room_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Admitted', CURDATE(), ?, ?, ?)
            ";
            
            $stmt = $conn->prepare($insert_query);
            $allergies = $input['allergies'] ?: 'None';
            
            $stmt->bind_param(
                "sisssssssss",
                $input['name'],
                $input['age'],
                $input['gender'],
                $input['contact_number'],
                $input['address'],
                $input['date_of_birth'],
                $input['blood_type'],
                $allergies,
                $input['reason_for_admission'],
                $input['floor_number'],
                $input['room_number']
            );
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to create patient: ' . $stmt->error);
            }
            
            $patient_id = $conn->insert_id;
            
            // Create an appointment with the selected doctor if doctor_id is provided
            if (isset($input['doctor_id']) && !empty($input['doctor_id'])) {
                $appointment_query = "
                    INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, reason, status)
                    VALUES (?, ?, NOW(), ?, 'Scheduled')
                ";
                
                $appointment_stmt = $conn->prepare($appointment_query);
                $appointment_reason = "Initial consultation - " . $input['reason_for_admission'];
                $appointment_stmt->bind_param("iis", $patient_id, $input['doctor_id'], $appointment_reason);
                
                if (!$appointment_stmt->execute()) {
                    error_log("Warning: Failed to create appointment for new patient: " . $appointment_stmt->error);
                }
            }
            
            // Update room status if room information is provided
            if ($input['floor_number'] !== 'N/A' && $input['room_number'] !== 'N/A') {
                // Find the room by floor and room number
                $room_query = "SELECT room_id, status FROM rooms WHERE floor = ? AND room_number = ?";
                $room_stmt = $conn->prepare($room_query);
                $room_stmt->bind_param("is", $input['floor_number'], $input['room_number']);
                $room_stmt->execute();
                $room_result = $room_stmt->get_result();
                
                if ($room_result->num_rows > 0) {
                    $room_data = $room_result->fetch_assoc();
                    $room_id = $room_data['room_id'];
                    $current_status = $room_data['status'];
                    
                    // Check if room is available
                    if ($current_status === 'Vacant') {
                        // Update room to occupied and assign patient
                        $update_room_query = "UPDATE rooms SET status = 'Occupied', patient_id = ? WHERE room_id = ?";
                        $update_room_stmt = $conn->prepare($update_room_query);
                        $update_room_stmt->bind_param("ii", $patient_id, $room_id);
                        
                        if (!$update_room_stmt->execute()) {
                            error_log("Warning: Failed to update room status for new patient: " . $update_room_stmt->error);
                        }
                    } else {
                        // Room is not available, but we'll still create the patient
                        error_log("Warning: Room {$input['room_number']} on floor {$input['floor_number']} is not vacant. Patient created but room not assigned.");
                    }
                } else {
                    error_log("Warning: Room {$input['room_number']} on floor {$input['floor_number']} does not exist.");
                }
            }
            
            $conn->commit();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Patient created successfully',
                'patient_id' => $patient_id
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create patient: ' . $e->getMessage()
        ]);
    }
}

$conn->close();
?>
