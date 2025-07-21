<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'records') {
                getMedicalRecords($conn);
            } elseif ($action === 'record_details') {
                $recordId = $_GET['record_id'] ?? '';
                if (empty($recordId)) {
                    throw new Exception('Record ID is required');
                }
                getMedicalRecordDetails($conn, $recordId);
            } else {
                throw new Exception('Invalid action');
            }
            break;
        
        case 'POST':
            if ($action === 'create_record') {
                $data = json_decode(file_get_contents('php://input'), true);
                createMedicalRecord($conn, $data);
            } else {
                throw new Exception('Invalid action');
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

function getMedicalRecords($conn) {
    try {
        $query = "
            SELECT 
                mr.record_id,
                mr.record_date,
                mr.record_type,
                mr.details,
                p.patient_id,
                p.name as patient_name,
                p.date_of_admission,
                d.name as doctor_name,
                b.bill_id,
                b.total_amount,
                b.status as bill_status,
                b.bill_date,
                CONCAT('INV-', YEAR(b.bill_date), '-', LPAD(b.bill_id, 3, '0')) as invoice_id
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.patient_id
            LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
            LEFT JOIN bills b ON p.patient_id = b.patient_id 
                AND DATE(b.bill_date) = DATE(mr.record_date)
            ORDER BY mr.record_date DESC
        ";
        
        $result = $conn->query($query);
        if (!$result) {
            throw new Exception('Database query failed: ' . $conn->error);
        }
        
        $records = [];
        while ($row = $result->fetch_assoc()) {
            $records[] = $row;
        }
        
        // Format the records for frontend
        $formattedRecords = [];
        foreach ($records as $record) {
            $recordId = 'REC' . str_pad($record['record_id'], 3, '0', STR_PAD_LEFT);
            
            $formattedRecord = [
                'id' => $recordId,
                'patient' => [
                    'name' => $record['patient_name'] ?? 'Unknown Patient'
                ],
                'doctor' => $record['doctor_name'] ?? 'Unknown Doctor',
                'date' => $record['record_date'],
                'dateOfAdmission' => $record['date_of_admission'],
                'type' => $record['record_type'],
                'details' => $record['details'],
                'bill' => [
                    'invoiceId' => $record['invoice_id'] ?? 'N/A',
                    'status' => $record['bill_status'] ?? 'No Bill',
                    'items' => []
                ]
            ];
            
            $formattedRecords[] = $formattedRecord;
        }
        
        echo json_encode(['success' => true, 'data' => $formattedRecords]);
        
    } catch (Exception $e) {
        throw new Exception('Error fetching medical records: ' . $e->getMessage());
    }
}

function getMedicalRecordDetails($conn, $recordId) {
    try {
        // Extract numeric ID from formatted ID (e.g., REC001 -> 1)
        $numericId = (int)substr($recordId, 3);
        
        $query = "
            SELECT 
                mr.record_id,
                mr.record_date,
                mr.record_type,
                mr.details,
                p.patient_id,
                p.name as patient_name,
                p.date_of_admission,
                d.name as doctor_name,
                b.bill_id,
                b.total_amount,
                b.status as bill_status,
                b.bill_date,
                CONCAT('INV-', YEAR(b.bill_date), '-', LPAD(b.bill_id, 3, '0')) as invoice_id
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.patient_id
            LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
            LEFT JOIN bills b ON p.patient_id = b.patient_id 
                AND DATE(b.bill_date) = DATE(mr.record_date)
            WHERE mr.record_id = ?
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param('i', $numericId);
        $stmt->execute();
        $result = $stmt->get_result();
        $record = $result->fetch_assoc();
        
        if (!$record) {
            throw new Exception('Medical record not found');
        }
        
        // Get bill items if bill exists
        $billItems = [];
        if ($record['bill_id']) {
            $itemsQuery = "
                SELECT description, quantity, unit_price, line_total
                FROM bill_items 
                WHERE bill_id = ?
            ";
            $itemsStmt = $conn->prepare($itemsQuery);
            $itemsStmt->bind_param('i', $record['bill_id']);
            $itemsStmt->execute();
            $itemsResult = $itemsStmt->get_result();
            
            while ($item = $itemsResult->fetch_assoc()) {
                $billItems[] = [
                    'description' => $item['description'],
                    'amount' => '₱' . number_format($item['line_total'], 2)
                ];
            }
        }
        
        $formattedRecord = [
            'id' => 'REC' . str_pad($record['record_id'], 3, '0', STR_PAD_LEFT),
            'patient' => [
                'name' => $record['patient_name'] ?? 'Unknown Patient'
            ],
            'doctor' => $record['doctor_name'] ?? 'Unknown Doctor',
            'date' => $record['record_date'],
            'dateOfAdmission' => $record['date_of_admission'],
            'type' => $record['record_type'],
            'details' => $record['details'],
            'bill' => [
                'invoiceId' => $record['invoice_id'] ?? 'N/A',
                'status' => $record['bill_status'] ?? 'No Bill',
                'items' => $billItems
            ]
        ];
        
        echo json_encode(['success' => true, 'data' => $formattedRecord]);
        
    } catch (Exception $e) {
        throw new Exception('Error fetching medical record details: ' . $e->getMessage());
    }
}

function createMedicalRecord($conn, $data) {
    try {
        $conn->autocommit(false);
        
        $query = "
            INSERT INTO medical_records (patient_id, doctor_id, record_date, record_type, details)
            VALUES (?, ?, ?, ?, ?)
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param('iisss', 
            $data['patient_id'],
            $data['doctor_id'],
            $data['record_date'],
            $data['record_type'],
            $data['details']
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Execute failed: ' . $stmt->error);
        }
        
        $recordId = $conn->insert_id;
        $conn->commit();
        $conn->autocommit(true);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Medical record created successfully',
            'record_id' => $recordId
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        $conn->autocommit(true);
        throw new Exception('Error creating medical record: ' . $e->getMessage());
    }
}
?>
