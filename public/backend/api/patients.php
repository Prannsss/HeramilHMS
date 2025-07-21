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
                p.date_of_discharge,
                MAX(a.appointment_datetime) as last_visit,
                d.name as doctor_name
            FROM patients p
            LEFT JOIN appointments a ON p.patient_id = a.patient_id
            LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
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
            // Update patient status to Discharged and set discharge date
            $discharge_query = "
                UPDATE patients 
                SET status = 'Discharged', 
                    date_of_discharge = CURDATE() 
                WHERE patient_id = ?
            ";
            
            $stmt = $conn->prepare($discharge_query);
            $stmt->bind_param("i", $patient_id);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Patient discharged successfully'
                    ]);
                } else {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Patient not found or already discharged'
                    ]);
                }
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to discharge patient: ' . $stmt->error
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

$conn->close();
?>
