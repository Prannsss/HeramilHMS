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

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            handleGet($conn);
            break;
        case 'POST':
            handlePost($conn);
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
        $query = "SELECT 
                    b.bill_id,
                    b.patient_id,
                    p.name as patient_name,
                    p.contact_number as patient_email,
                    p.date_of_admission as dateOfAdmission,
                    b.bill_date as date,
                    b.total_amount,
                    b.status
                  FROM bills b 
                  JOIN patients p ON b.patient_id = p.patient_id 
                  ORDER BY b.bill_date DESC";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception("Database query failed: " . $conn->error);
        }
        
        $bills = [];
        while ($row = $result->fetch_assoc()) {
            $invoiceId = 'INV-' . date('Y', strtotime($row['date'])) . '-' . str_pad($row['bill_id'], 3, '0', STR_PAD_LEFT);
            
            $items_query = "SELECT description, quantity, unit_price, line_total FROM bill_items WHERE bill_id = ?";
            $items_stmt = $conn->prepare($items_query);
            $items_stmt->bind_param("i", $row['bill_id']);
            $items_stmt->execute();
            $items_result = $items_stmt->get_result();
            
            $items = [];
            while ($item = $items_result->fetch_assoc()) {
                $items[] = [
                    'description' => $item['description'],
                    'quantity' => (int) $item['quantity'],
                    'unit_price' => (float) $item['unit_price'],
                    'amount' => '₱' . number_format($item['line_total'], 2)
                ];
            }
            
            $bills[] = [
                'invoiceId' => $invoiceId,
                'bill_id' => (int) $row['bill_id'],
                'patient' => [
                    'name' => $row['patient_name'],
                    'email' => $row['patient_email'] ?: 'No email provided'
                ],
                'date' => $row['date'],
                'dateOfAdmission' => $row['dateOfAdmission'],
                'status' => $row['status'],
                'total_amount' => (float) $row['total_amount'],
                'items' => $items
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $bills
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch bills: ' . $e->getMessage()]);
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
        
        // Validate required fields
        $required_fields = ['patient_id', 'items'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }
        
        // Calculate total amount
        $total_amount = 0;
        foreach ($input['items'] as $item) {
            $total_amount += $item['quantity'] * $item['unit_price'];
        }
        
        // Set bill date and status
        $bill_date = isset($input['bill_date']) ? $input['bill_date'] : date('Y-m-d');
        $status = isset($input['status']) ? $input['status'] : 'Pending';
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Insert bill
            $stmt = $conn->prepare("INSERT INTO bills (patient_id, bill_date, total_amount, status) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isds", $input['patient_id'], $bill_date, $total_amount, $status);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to insert bill: " . $stmt->error);
            }
            
            $bill_id = $conn->insert_id;
            
            // Insert bill items
            $item_stmt = $conn->prepare("INSERT INTO bill_items (bill_id, description, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)");
            
            foreach ($input['items'] as $item) {
                $line_total = $item['quantity'] * $item['unit_price'];
                $item_stmt->bind_param("isidd", $bill_id, $item['description'], $item['quantity'], $item['unit_price'], $line_total);
                
                if (!$item_stmt->execute()) {
                    throw new Exception("Failed to insert bill item: " . $item_stmt->error);
                }
            }
            
            // Commit transaction
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Bill created successfully',
                'bill_id' => $bill_id,
                'total_amount' => $total_amount
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create bill: ' . $e->getMessage()]);
    }
}

function handlePut($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['invoiceId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input or missing invoice ID']);
            return;
        }
        
        $invoice_parts = explode('-', $input['invoiceId']);
        $bill_id = (int) $invoice_parts[2];

        if (isset($input['status'])) {
            $stmt = $conn->prepare("UPDATE bills SET status = ? WHERE bill_id = ?");
            $stmt->bind_param("si", $input['status'], $bill_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Bill status updated successfully'
                ]);
            } else {
                throw new Exception("Failed to update bill status: " . $stmt->error);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Only status updates are currently supported']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update bill: ' . $e->getMessage()]);
    }
}

function handleDelete($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['invoiceId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing invoice ID']);
            return;
        }
        
        $invoice_parts = explode('-', $input['invoiceId']);
        $bill_id = (int) $invoice_parts[2];
        
        $conn->begin_transaction();
        
        try {
            $items_stmt = $conn->prepare("DELETE FROM bill_items WHERE bill_id = ?");
            $items_stmt->bind_param("i", $bill_id);
            $items_stmt->execute();
            
            // Delete the bill
            $stmt = $conn->prepare("DELETE FROM bills WHERE bill_id = ?");
            $stmt->bind_param("i", $bill_id);
            
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                $conn->commit();
                echo json_encode([
                    'success' => true,
                    'message' => 'Bill deleted successfully'
                ]);
            } else {
                $conn->rollback();
                http_response_code(404);
                echo json_encode(['error' => 'Bill not found']);
            }
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete bill: ' . $e->getMessage()]);
    }
}

$conn->close();
?>
