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
            // Get patients assigned to a specific doctor
            try {
                $doctor_id = isset($_GET['doctor_id']) ? intval($_GET['doctor_id']) : 1; // Default to doctor ID 1
                
                $query = "
                    SELECT DISTINCT
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
                        p.date_of_discharge,
                        p.floor_number,
                        p.room_number,
                        MAX(a.appointment_datetime) as last_visit,
                        d.name as doctor_name
                    FROM patients p
                    INNER JOIN appointments a ON p.patient_id = a.patient_id
                    LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
                    WHERE a.doctor_id = ? 
                    AND a.status IN ('Scheduled', 'Completed')
                    GROUP BY p.patient_id
                    ORDER BY p.status ASC, MAX(a.appointment_datetime) DESC
                ";
                
                $stmt = $conn->prepare($query);
                $stmt->bind_param("i", $doctor_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $patients = [];
                while ($row = $result->fetch_assoc()) {
                    // Generate email from name
                    $email = strtolower(str_replace(' ', '.', $row['name'])) . '@email.com';
                    
                    // Format last visit date
                    $lastVisit = $row['last_visit'] ? date('Y-m-d', strtotime($row['last_visit'])) : null;
                    
                    // Get prescriptions for this patient
                    $prescriptions_query = "SELECT details FROM medical_records WHERE patient_id = ? AND record_type = 'Prescription' ORDER BY record_date DESC";
                    $prescriptions_stmt = $conn->prepare($prescriptions_query);
                    $prescriptions_stmt->bind_param("i", $row['patient_id']);
                    $prescriptions_stmt->execute();
                    $prescriptions_result = $prescriptions_stmt->get_result();
                    
                    $prescriptions = [];
                    while ($prescription_row = $prescriptions_result->fetch_assoc()) {
                        $prescriptions[] = $prescription_row['details'];
                    }
                    
                    // Get billing information
                    $billing_query = "
                        SELECT bi.description, bi.line_total 
                        FROM bills b 
                        JOIN bill_items bi ON b.bill_id = bi.bill_id 
                        WHERE b.patient_id = ?
                        ORDER BY b.bill_date DESC
                    ";
                    $billing_stmt = $conn->prepare($billing_query);
                    $billing_stmt->bind_param("i", $row['patient_id']);
                    $billing_stmt->execute();
                    $billing_result = $billing_stmt->get_result();
                    
                    $billItems = [];
                    while ($billing_row = $billing_result->fetch_assoc()) {
                        $billItems[] = [
                            'description' => $billing_row['description'],
                            'amount' => '₱' . number_format($billing_row['line_total'], 2)
                        ];
                    }
                    
                    // Add default consultation fee if no billing items
                    if (empty($billItems)) {
                        $billItems[] = [
                            'description' => 'Consultation Fee',
                            'amount' => '₱150.00'
                        ];
                    }
                    
                    $patients[] = [
                        'id' => 'PAT' . str_pad($row['patient_id'], 3, '0', STR_PAD_LEFT),
                        'patient_id' => $row['patient_id'],
                        'name' => $row['name'],
                        'email' => $email,
                        'mobile' => $row['contact_number'] ?: '555-0000',
                        'address' => $row['address'],
                        'dob' => $row['date_of_birth'],
                        'lastVisit' => $lastVisit,
                        'status' => $row['status'],
                        'doctor' => $row['doctor_name'] ?: 'Dr. Jayson Ado',
                        'bloodType' => $row['blood_type'],
                        'allergies' => $row['allergies'],
                        'dateOfAdmission' => $row['date_of_admission'],
                        'reasonForAdmission' => $row['reason_for_admission'],
                        'reasonForAppointment' => $row['reason_for_appointment'],
                        'dateOfDischarge' => $row['date_of_discharge'],
                        'floorNumber' => $row['floor_number'] ?: 'N/A',
                        'roomNumber' => $row['room_number'] ?: 'N/A',
                        'prescriptions' => $prescriptions,
                        'usedItems' => [], // TODO: Implement inventory tracking
                        'billItems' => $billItems
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
        } elseif ($_GET['action'] === 'inventory') {
            // Get inventory items for prescriptions
            try {
                $query = "SELECT item_id, name, stock_quantity, unit_price FROM inventory WHERE stock_quantity > 0 ORDER BY name";
                $result = $conn->query($query);
                
                $inventory = [];
                while ($row = $result->fetch_assoc()) {
                    $inventory[] = [
                        'id' => 'INV' . str_pad($row['item_id'], 3, '0', STR_PAD_LEFT),
                        'item_id' => $row['item_id'],
                        'name' => $row['name'],
                        'stock_quantity' => $row['stock_quantity'],
                        'price' => floatval($row['unit_price'])
                    ];
                }
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $inventory
                ]);
                
            } catch (Exception $e) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to fetch inventory: ' . $e->getMessage()
                ]);
            }
        } elseif ($_GET['action'] === 'patient_details' && isset($_GET['patient_id'])) {
            // Get detailed patient information including medical records and billing
            try {
                $patient_id = intval($_GET['patient_id']);
                
                // Get patient basic info
                $patient_query = "
                    SELECT 
                        p.*,
                        MAX(a.appointment_datetime) as last_visit
                    FROM patients p
                    LEFT JOIN appointments a ON p.patient_id = a.patient_id
                    WHERE p.patient_id = ?
                    GROUP BY p.patient_id
                ";
                
                $stmt = $conn->prepare($patient_query);
                $stmt->bind_param("i", $patient_id);
                $stmt->execute();
                $patient_result = $stmt->get_result();
                
                if ($patient_result->num_rows === 0) {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Patient not found'
                    ]);
                    exit;
                }
                
                $patient = $patient_result->fetch_assoc();
                
                // Get medical records (prescriptions and diagnoses)
                $medical_query = "
                    SELECT 
                        mr.record_id,
                        mr.record_date,
                        mr.record_type,
                        mr.details,
                        d.name as doctor_name
                    FROM medical_records mr
                    LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
                    WHERE mr.patient_id = ?
                    ORDER BY mr.record_date DESC, mr.record_id DESC
                ";
                
                $medical_stmt = $conn->prepare($medical_query);
                $medical_stmt->bind_param("i", $patient_id);
                $medical_stmt->execute();
                $medical_result = $medical_stmt->get_result();
                
                $prescriptions = [];
                $diagnoses = [];
                $other_records = [];
                
                while ($record = $medical_result->fetch_assoc()) {
                    $record_data = [
                        'id' => $record['record_id'],
                        'date' => $record['record_date'],
                        'type' => $record['record_type'],
                        'details' => $record['details'],
                        'doctor' => $record['doctor_name']
                    ];
                    
                    if ($record['record_type'] === 'Prescription') {
                        $prescriptions[] = $record_data;
                    } elseif ($record['record_type'] === 'Diagnosis') {
                        $diagnoses[] = $record_data;
                    } else {
                        $other_records[] = $record_data;
                    }
                }
                
                // Get billing information with detailed breakdown
                $billing_query = "
                    SELECT 
                        b.bill_id,
                        b.bill_date,
                        b.total_amount,
                        b.status as bill_status,
                        bi.description,
                        bi.quantity,
                        bi.unit_price,
                        bi.line_total
                    FROM bills b
                    LEFT JOIN bill_items bi ON b.bill_id = bi.bill_id
                    WHERE b.patient_id = ?
                    ORDER BY b.bill_date DESC, bi.bill_item_id
                ";
                
                $billing_stmt = $conn->prepare($billing_query);
                $billing_stmt->bind_param("i", $patient_id);
                $billing_stmt->execute();
                $billing_result = $billing_stmt->get_result();
                
                $bills = [];
                $total_amount = 0;
                
                while ($bill_row = $billing_result->fetch_assoc()) {
                    if ($bill_row['bill_id']) {
                        $bills[] = [
                            'bill_id' => $bill_row['bill_id'],
                            'date' => $bill_row['bill_date'],
                            'description' => $bill_row['description'],
                            'quantity' => $bill_row['quantity'],
                            'unit_price' => floatval($bill_row['unit_price']),
                            'line_total' => floatval($bill_row['line_total']),
                            'status' => $bill_row['bill_status']
                        ];
                        $total_amount += floatval($bill_row['line_total']);
                    }
                }
                
                // Get recent appointments
                $appointments_query = "
                    SELECT 
                        a.appointment_id,
                        a.appointment_datetime,
                        a.reason,
                        a.status,
                        d.name as doctor_name
                    FROM appointments a
                    LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
                    WHERE a.patient_id = ?
                    ORDER BY a.appointment_datetime DESC
                    LIMIT 5
                ";
                
                $appointments_stmt = $conn->prepare($appointments_query);
                $appointments_stmt->bind_param("i", $patient_id);
                $appointments_stmt->execute();
                $appointments_result = $appointments_stmt->get_result();
                
                $appointments = [];
                while ($appointment = $appointments_result->fetch_assoc()) {
                    $appointments[] = [
                        'id' => $appointment['appointment_id'],
                        'datetime' => $appointment['appointment_datetime'],
                        'reason' => $appointment['reason'],
                        'status' => $appointment['status'],
                        'doctor' => $appointment['doctor_name']
                    ];
                }
                
                echo json_encode([
                    'status' => 'success',
                    'data' => [
                        'patient' => [
                            'id' => 'PAT' . str_pad($patient['patient_id'], 3, '0', STR_PAD_LEFT),
                            'patient_id' => $patient['patient_id'],
                            'name' => $patient['name'],
                            'email' => strtolower(str_replace(' ', '.', $patient['name'])) . '@email.com',
                            'mobile' => $patient['contact_number'] ?: '555-0000',
                            'address' => $patient['address'],
                            'dob' => $patient['date_of_birth'],
                            'age' => $patient['age'],
                            'gender' => $patient['gender'],
                            'bloodType' => $patient['blood_type'],
                            'allergies' => $patient['allergies'],
                            'status' => $patient['status'],
                            'dateOfAdmission' => $patient['date_of_admission'],
                            'reasonForAdmission' => $patient['reason_for_admission'],
                            'reasonForAppointment' => $patient['reason_for_appointment'],
                            'dateOfDischarge' => $patient['date_of_discharge'],
                            'floorNumber' => $patient['floor_number'] ?: 'N/A',
                            'roomNumber' => $patient['room_number'] ?: 'N/A',
                            'lastVisit' => $patient['last_visit'] ? date('Y-m-d', strtotime($patient['last_visit'])) : null
                        ],
                        'prescriptions' => $prescriptions,
                        'diagnoses' => $diagnoses,
                        'other_records' => $other_records,
                        'bills' => $bills,
                        'total_amount' => $total_amount,
                        'appointments' => $appointments
                    ]
                ]);
                
            } catch (Exception $e) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Failed to fetch patient details: ' . $e->getMessage()
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid action'
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
    $action = $_POST['action'] ?? $_GET['action'] ?? null;
    
    if ($action === 'prescription') {
        // Save prescription and used items
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['patient_id']) || !isset($input['doctor_id'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Missing required fields: patient_id, doctor_id'
                ]);
                exit;
            }
            
            $patient_id = intval($input['patient_id']);
            $doctor_id = intval($input['doctor_id']);
            $prescription = isset($input['prescription']) ? trim($input['prescription']) : '';
            $used_items = isset($input['used_items']) ? $input['used_items'] : [];
            $record_date = date('Y-m-d');
            
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Save prescription if provided
                if (!empty($prescription)) {
                    $prescription_query = "
                        INSERT INTO medical_records (patient_id, doctor_id, record_date, record_type, details)
                        VALUES (?, ?, ?, 'Prescription', ?)
                    ";
                    $prescription_stmt = $conn->prepare($prescription_query);
                    $prescription_stmt->bind_param("iiss", $patient_id, $doctor_id, $record_date, $prescription);
                    $prescription_stmt->execute();
                }
                
                // Process used items
                if (!empty($used_items)) {
                    // Create or get existing bill for today
                    $bill_query = "SELECT bill_id FROM bills WHERE patient_id = ? AND bill_date = ?";
                    $bill_stmt = $conn->prepare($bill_query);
                    $bill_stmt->bind_param("is", $patient_id, $record_date);
                    $bill_stmt->execute();
                    $bill_result = $bill_stmt->get_result();
                    
                    if ($bill_result->num_rows > 0) {
                        $bill_row = $bill_result->fetch_assoc();
                        $bill_id = $bill_row['bill_id'];
                    } else {
                        // Create new bill
                        $create_bill_query = "INSERT INTO bills (patient_id, bill_date, total_amount, status) VALUES (?, ?, 0, 'Pending')";
                        $create_bill_stmt = $conn->prepare($create_bill_query);
                        $create_bill_stmt->bind_param("is", $patient_id, $record_date);
                        $create_bill_stmt->execute();
                        $bill_id = $conn->insert_id;
                    }
                    
                    // Add used items to bill
                    foreach ($used_items as $item) {
                        $item_id = intval($item['item_id']);
                        $quantity = intval($item['quantity']);
                        $unit_price = floatval($item['price']);
                        $line_total = $quantity * $unit_price;
                        
                        // Add to bill_items
                        $bill_item_query = "
                            INSERT INTO bill_items (bill_id, description, quantity, unit_price, line_total)
                            VALUES (?, ?, ?, ?, ?)
                        ";
                        $bill_item_stmt = $conn->prepare($bill_item_query);
                        $description = "Used Item: " . $item['name'] . " (x" . $quantity . ")";
                        $bill_item_stmt->bind_param("isidd", $bill_id, $description, $quantity, $unit_price, $line_total);
                        $bill_item_stmt->execute();
                        
                        // Update inventory
                        $update_inventory_query = "UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE item_id = ?";
                        $update_inventory_stmt = $conn->prepare($update_inventory_query);
                        $update_inventory_stmt->bind_param("ii", $quantity, $item_id);
                        $update_inventory_stmt->execute();
                    }
                    
                    // Update total bill amount
                    $update_total_query = "
                        UPDATE bills SET total_amount = (
                            SELECT SUM(line_total) FROM bill_items WHERE bill_id = ?
                        ) WHERE bill_id = ?
                    ";
                    $update_total_stmt = $conn->prepare($update_total_query);
                    $update_total_stmt->bind_param("ii", $bill_id, $bill_id);
                    $update_total_stmt->execute();
                }
                
                // Commit transaction
                $conn->commit();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Prescription saved successfully'
                ]);
                
            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
            
        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to save prescription: ' . $e->getMessage()
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid action'
        ]);
    }
}

$conn->close();
?>