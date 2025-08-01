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
require_once 'auth_helpers.php';

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
            } elseif ($action === 'add_entry') {
                $data = json_decode(file_get_contents('php://input'), true);
                addMedicalEntry($conn, $data);
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
        // Get doctor ID from authentication
        $doctor_id = getDoctorIdFromAuth();
        
        if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: Invalid or missing doctor authentication']);
            return;
        }
        
        $query = "
            SELECT 
                mr.record_id,
                mr.created_date,
                mr.last_updated,
                mr.record_entries,
                p.patient_id,
                p.name as patient_name,
                p.date_of_admission,
                d.name as doctor_name,
                b.bill_id,
                b.total_amount,
                b.status as bill_status,
                b.bill_date,
                CONCAT('INV-', YEAR(COALESCE(b.bill_date, mr.created_date)), '-', LPAD(COALESCE(b.bill_id, mr.record_id), 3, '0')) as invoice_id
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.patient_id
            LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
            LEFT JOIN bills b ON p.patient_id = b.patient_id 
                AND DATE(b.bill_date) >= DATE(mr.created_date)
            WHERE mr.doctor_id = ?
            ORDER BY mr.last_updated DESC
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Database prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param('i', $doctor_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$result) {
            throw new Exception('Database query failed: ' . $conn->error);
        }
        
        $formattedRecords = [];
        while ($row = $result->fetch_assoc()) {
            $recordId = 'REC' . str_pad($row['record_id'], 3, '0', STR_PAD_LEFT);
            
            // Parse the JSON record entries
            $recordEntries = json_decode($row['record_entries'], true) ?: [];
            
            // Get the latest entry for display in the list
            $latestEntry = end($recordEntries);
            if (!$latestEntry) {
                $latestEntry = [
                    'date' => $row['created_date'],
                    'type' => 'General',
                    'details' => 'No entries available'
                ];
            }
            
            // Create a summary of all entry types
            $entryTypes = array_unique(array_column($recordEntries, 'type'));
            $typesSummary = implode(', ', $entryTypes);
            
            $formattedRecord = [
                'id' => $recordId,
                'patient' => [
                    'name' => $row['patient_name'] ?? 'Unknown Patient'
                ],
                'doctor' => $row['doctor_name'] ?? 'Unknown Doctor',
                'date' => $row['last_updated'],
                'dateOfAdmission' => $row['date_of_admission'],
                'type' => $typesSummary ?: $latestEntry['type'],
                'details' => $latestEntry['details'],
                'entryCount' => count($recordEntries),
                'bill' => [
                    'invoiceId' => $row['invoice_id'] ?? 'N/A',
                    'status' => $row['bill_status'] ?? 'No Bill',
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
        // Get doctor ID from authentication
        $doctor_id = getDoctorIdFromAuth();
        
        if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: Invalid or missing doctor authentication']);
            return;
        }
        
        // Extract numeric ID from formatted ID (e.g., REC001 -> 1)
        $numericId = (int)substr($recordId, 3);
        
        $query = "
            SELECT 
                mr.record_id,
                mr.created_date,
                mr.last_updated,
                mr.record_entries,
                p.patient_id,
                p.name as patient_name,
                p.date_of_admission,
                d.name as doctor_name,
                b.bill_id,
                b.total_amount,
                b.status as bill_status,
                b.bill_date,
                CONCAT('INV-', YEAR(COALESCE(b.bill_date, mr.created_date)), '-', LPAD(COALESCE(b.bill_id, mr.record_id), 3, '0')) as invoice_id
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.patient_id
            LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
            LEFT JOIN bills b ON p.patient_id = b.patient_id 
                AND DATE(b.bill_date) >= DATE(mr.created_date)
            WHERE mr.record_id = ? AND mr.doctor_id = ?
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param('ii', $numericId, $doctor_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $record = $result->fetch_assoc();
        
        if (!$record) {
            throw new Exception('Medical record not found or access denied');
        }
        
        // Parse the JSON record entries
        $recordEntries = json_decode($record['record_entries'], true) ?: [];
        
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
        
        // Create consolidated details from all entries
        $consolidatedDetails = '';
        foreach ($recordEntries as $entry) {
            $entryDate = $entry['date'];
            $entryType = $entry['type'];
            $entryDetails = $entry['details'];
            $consolidatedDetails .= "[$entryDate] $entryType: $entryDetails\n\n";
        }
        
        // Get the latest entry for type display
        $latestEntry = end($recordEntries);
        $entryTypes = array_unique(array_column($recordEntries, 'type'));
        $typesSummary = implode(', ', $entryTypes);
        
        $formattedRecord = [
            'id' => 'REC' . str_pad($record['record_id'], 3, '0', STR_PAD_LEFT),
            'patient' => [
                'name' => $record['patient_name'] ?? 'Unknown Patient'
            ],
            'doctor' => $record['doctor_name'] ?? 'Unknown Doctor',
            'date' => $record['last_updated'],
            'dateOfAdmission' => $record['date_of_admission'],
            'type' => $typesSummary ?: ($latestEntry['type'] ?? 'General'),
            'details' => trim($consolidatedDetails) ?: 'No entries available',
            'entries' => $recordEntries,
            'entryCount' => count($recordEntries),
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
        
        // Create initial entry
        $initialEntry = [
            'date' => $data['record_date'],
            'type' => $data['record_type'],
            'details' => $data['details'],
            'timestamp' => time()
        ];
        
        $query = "
            INSERT INTO medical_records (patient_id, doctor_id, created_date, record_entries)
            VALUES (?, ?, ?, ?)
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        $entriesJson = json_encode([$initialEntry]);
        $stmt->bind_param('iiss', 
            $data['patient_id'],
            $data['doctor_id'],
            $data['record_date'],
            $entriesJson
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

function addMedicalEntry($conn, $data) {
    try {
        // Get doctor ID from authentication
        $doctor_id = getDoctorIdFromAuth();
        
        if (!$doctor_id || !validateDoctor($conn, $doctor_id)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized: Invalid or missing doctor authentication']);
            return;
        }
        
        $conn->autocommit(false);
        
        // Check if a record exists for this patient-doctor combination
        $checkQuery = "SELECT record_id, record_entries FROM medical_records WHERE patient_id = ? AND doctor_id = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param('ii', $data['patient_id'], $doctor_id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $existingRecord = $result->fetch_assoc();
        
        $newEntry = [
            'date' => $data['record_date'] ?? date('Y-m-d'),
            'type' => $data['record_type'],
            'details' => $data['details'],
            'timestamp' => time()
        ];
        
        if ($existingRecord) {
            // Update existing record
            $currentEntries = json_decode($existingRecord['record_entries'], true) ?: [];
            $currentEntries[] = $newEntry;
            
            $updateQuery = "UPDATE medical_records SET record_entries = ?, last_updated = NOW() WHERE record_id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $entriesJson = json_encode($currentEntries);
            $updateStmt->bind_param('si', $entriesJson, $existingRecord['record_id']);
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to update medical record: ' . $updateStmt->error);
            }
            
            $recordId = $existingRecord['record_id'];
            $message = 'Medical entry added successfully';
        } else {
            // Create new record
            $insertQuery = "INSERT INTO medical_records (patient_id, doctor_id, created_date, record_entries) VALUES (?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertQuery);
            $entriesJson = json_encode([$newEntry]);
            $createDate = $data['record_date'] ?? date('Y-m-d');
            $insertStmt->bind_param('iiss', $data['patient_id'], $doctor_id, $createDate, $entriesJson);
            
            if (!$insertStmt->execute()) {
                throw new Exception('Failed to create medical record: ' . $insertStmt->error);
            }
            
            $recordId = $conn->insert_id;
            $message = 'Medical record created successfully';
        }
        
        $conn->commit();
        $conn->autocommit(true);
        
        echo json_encode([
            'success' => true, 
            'message' => $message,
            'record_id' => $recordId
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        $conn->autocommit(true);
        throw new Exception('Error adding medical entry: ' . $e->getMessage());
    }
}
?>
