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
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'patients') {
            // Get active patients for diagnosis
            try {
                $query = "
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
                        p.date_of_discharge,
                        MAX(a.appointment_datetime) as last_visit
                    FROM patients p
                    LEFT JOIN appointments a ON p.patient_id = a.patient_id
                    WHERE p.status = 'Active'
                    GROUP BY p.patient_id
                    ORDER BY p.date_of_admission DESC
                ";
                
                $result = $conn->query($query);
                $patients = [];
                
                while ($row = $result->fetch_assoc()) {
                    // Generate email from name
                    $email = strtolower(str_replace(' ', '.', $row['name'])) . '@email.com';
                    
                    // Format last visit date
                    $lastVisit = $row['last_visit'] ? date('Y-m-d', strtotime($row['last_visit'])) : null;
                    
                    $patients[] = [
                        'id' => 'PAT' . str_pad($row['patient_id'], 3, '0', STR_PAD_LEFT),
                        'patient_id' => $row['patient_id'],
                        'name' => $row['name'],
                        'email' => $email,
                        'age' => $row['age'],
                        'gender' => $row['gender'],
                        'contact_number' => $row['contact_number'],
                        'address' => $row['address'],
                        'dob' => $row['date_of_birth'],
                        'bloodType' => $row['blood_type'],
                        'allergies' => $row['allergies'],
                        'status' => $row['status'],
                        'dateOfAdmission' => $row['date_of_admission'],
                        'reasonForAdmission' => $row['reason_for_admission'],
                        'dateOfDischarge' => $row['date_of_discharge'],
                        'lastVisit' => $lastVisit
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
        } elseif ($_GET['action'] === 'medical_records' && isset($_GET['patient_id'])) {
            // Get medical records for a specific patient
            try {
                $patient_id = intval($_GET['patient_id']);
                
                $query = "
                    SELECT 
                        mr.record_id,
                        mr.patient_id,
                        mr.doctor_id,
                        mr.record_date,
                        mr.record_type,
                        mr.details,
                        mr.file_path,
                        d.name as doctor_name,
                        p.name as patient_name
                    FROM medical_records mr
                    LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
                    LEFT JOIN patients p ON mr.patient_id = p.patient_id
                    WHERE mr.patient_id = ?
                    ORDER BY mr.record_date DESC, mr.record_id DESC
                ";
                
                $stmt = $conn->prepare($query);
                $stmt->bind_param("i", $patient_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $records = [];
                while ($row = $result->fetch_assoc()) {
                    $records[] = [
                        'record_id' => $row['record_id'],
                        'patient_id' => $row['patient_id'],
                        'doctor_id' => $row['doctor_id'],
                        'record_date' => $row['record_date'],
                        'record_type' => $row['record_type'],
                        'details' => $row['details'],
                        'file_path' => $row['file_path'],
                        'doctor_name' => $row['doctor_name'],
                        'patient_name' => $row['patient_name']
                    ];
                }
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $records
                ]);
                
            } catch (Exception $e) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to fetch medical records: ' . $e->getMessage()
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid action or missing parameters'
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Action parameter required'
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Save diagnosis (medical record)
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['patient_id']) || !isset($input['diagnosis']) || !isset($input['doctor_id'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Missing required fields: patient_id, diagnosis, doctor_id'
            ]);
            exit;
        }
        
        $patient_id = intval($input['patient_id']);
        $doctor_id = intval($input['doctor_id']);
        $diagnosis = $input['diagnosis'];
        $record_type = isset($input['record_type']) ? $input['record_type'] : 'Diagnosis';
        $record_date = date('Y-m-d');
        
        $query = "
            INSERT INTO medical_records (patient_id, doctor_id, record_date, record_type, details)
            VALUES (?, ?, ?, ?, ?)
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("iisss", $patient_id, $doctor_id, $record_date, $record_type, $diagnosis);
        
        if ($stmt->execute()) {
            $record_id = $conn->insert_id;
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Diagnosis saved successfully',
                'data' => [
                    'record_id' => $record_id,
                    'patient_id' => $patient_id,
                    'doctor_id' => $doctor_id,
                    'record_date' => $record_date,
                    'record_type' => $record_type,
                    'details' => $diagnosis
                ]
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to save diagnosis: ' . $stmt->error
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to save diagnosis: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update existing diagnosis
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['record_id']) || !isset($input['diagnosis'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Missing required fields: record_id, diagnosis'
            ]);
            exit;
        }
        
        $record_id = intval($input['record_id']);
        $diagnosis = $input['diagnosis'];
        
        $query = "UPDATE medical_records SET details = ? WHERE record_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("si", $diagnosis, $record_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Diagnosis updated successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update diagnosis: ' . $stmt->error
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update diagnosis: ' . $e->getMessage()
        ]);
    }
}

$conn->close();
?>