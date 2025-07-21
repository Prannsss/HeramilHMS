<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get all medical records with patient and doctor information
        $records_query = "
            SELECT 
                mr.record_id,
                mr.record_date,
                mr.record_type,
                mr.details,
                mr.file_path,
                p.patient_id,
                p.name as patient_name,
                p.date_of_admission,
                d.name as doctor_name,
                b.bill_id,
                b.bill_date,
                b.total_amount,
                b.status as bill_status
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.patient_id
            LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
            LEFT JOIN bills b ON p.patient_id = b.patient_id
            ORDER BY mr.record_date DESC, mr.record_id DESC
        ";
        
        $records_result = $conn->query($records_query);
        $records = [];
        
        while ($row = $records_result->fetch_assoc()) {
            // Generate a record ID in the format REC###
            $recordId = 'REC' . str_pad($row['record_id'], 3, '0', STR_PAD_LEFT);
            
            // Get bill items for this patient's bill
            $billItems = [];
            $invoiceId = 'N/A';
            $billStatus = 'No Bill';
            
            if ($row['bill_id']) {
                $invoiceId = 'INV-' . date('Y', strtotime($row['bill_date'])) . '-' . str_pad($row['bill_id'], 3, '0', STR_PAD_LEFT);
                $billStatus = $row['bill_status'];
                
                $bill_items_query = "
                    SELECT description, quantity, unit_price, line_total
                    FROM bill_items 
                    WHERE bill_id = ?
                ";
                $stmt = $conn->prepare($bill_items_query);
                $stmt->bind_param("i", $row['bill_id']);
                $stmt->execute();
                $bill_items_result = $stmt->get_result();
                
                while ($bill_row = $bill_items_result->fetch_assoc()) {
                    $billItems[] = [
                        'description' => $bill_row['description'],
                        'amount' => '₱' . number_format($bill_row['line_total'], 2)
                    ];
                }
            }
            
            // Check if record already exists in our array (due to multiple bills per patient)
            $existingRecordIndex = -1;
            foreach ($records as $index => $existingRecord) {
                if ($existingRecord['id'] === $recordId) {
                    $existingRecordIndex = $index;
                    break;
                }
            }
            
            if ($existingRecordIndex === -1) {
                // New record
                $records[] = [
                    'id' => $recordId,
                    'patient' => [
                        'name' => $row['patient_name'] ?: 'Unknown Patient'
                    ],
                    'doctor' => $row['doctor_name'] ?: 'Not assigned',
                    'date' => $row['record_date'],
                    'dateOfAdmission' => $row['date_of_admission'] ?: 'N/A',
                    'type' => $row['record_type'] ?: 'General',
                    'details' => $row['details'] ?: 'No details available',
                    'file_path' => $row['file_path'],
                    'bill' => [
                        'invoiceId' => $invoiceId,
                        'status' => $billStatus,
                        'items' => $billItems
                    ],
                    'record_id' => $row['record_id'] // Keep original ID for backend operations
                ];
            } else {
                // Update existing record with additional bill items if different bill
                if (!empty($billItems) && $row['bill_id']) {
                    $records[$existingRecordIndex]['bill']['items'] = array_merge(
                        $records[$existingRecordIndex]['bill']['items'],
                        $billItems
                    );
                }
            }
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
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $patient_id = $input['patient_id'];
        $doctor_id = $input['doctor_id'];
        $record_type = $input['record_type'];
        $details = $input['details'];
        $file_path = $input['file_path'] ?? null;
        
        $insert_query = "
            INSERT INTO medical_records (patient_id, doctor_id, record_date, record_type, details, file_path)
            VALUES (?, ?, CURDATE(), ?, ?, ?)
        ";
        
        $stmt = $conn->prepare($insert_query);
        $stmt->bind_param("iisss", $patient_id, $doctor_id, $record_type, $details, $file_path);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Medical record created successfully',
                'record_id' => $conn->insert_id
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to create medical record: ' . $stmt->error
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create medical record: ' . $e->getMessage()
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $record_id = $input['record_id'];
        $record_type = $input['record_type'];
        $details = $input['details'];
        
        $update_query = "
            UPDATE medical_records 
            SET record_type = ?, details = ?
            WHERE record_id = ?
        ";
        
        $stmt = $conn->prepare($update_query);
        $stmt->bind_param("ssi", $record_type, $details, $record_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Medical record updated successfully'
                ]);
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Medical record not found or no changes made'
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update medical record: ' . $stmt->error
            ]);
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update medical record: ' . $e->getMessage()
        ]);
    }
}

$conn->close();
?>
