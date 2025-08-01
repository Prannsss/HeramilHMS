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

// Include database connection
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
                    doctor_id as id,
                    name,
                    specialization as role,
                    email,
                    department,
                    status,
                    created_at,
                    updated_at
                  FROM doctors 
                  ORDER BY created_at DESC";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception("Database query failed: " . $conn->error);
        }
        
        $doctors = [];
        while ($row = $result->fetch_assoc()) {
            // Format the doctor ID to match frontend expectations
            $row['id'] = 'STF' . str_pad($row['id'], 3, '0', STR_PAD_LEFT);
            $doctors[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $doctors
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch doctors: ' . $e->getMessage()]);
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
        $required_fields = ['name', 'email', 'role', 'department'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }
        
        // Set default status if not provided
        $status = isset($input['status']) ? $input['status'] : 'Active';
        
        // Prepare and execute the insert statement
        $stmt = $conn->prepare("INSERT INTO doctors (name, specialization, email, department, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", 
            $input['name'], 
            $input['role'], 
            $input['email'], 
            $input['department'], 
            $status
        );
        
        if ($stmt->execute()) {
            $new_id = $conn->insert_id;
            
            // Fetch the newly created doctor
            $fetch_stmt = $conn->prepare("SELECT doctor_id as id, name, specialization as role, email, department, status, created_at, updated_at FROM doctors WHERE doctor_id = ?");
            $fetch_stmt->bind_param("i", $new_id);
            $fetch_stmt->execute();
            $result = $fetch_stmt->get_result();
            $new_doctor = $result->fetch_assoc();
            
            // Format the ID
            $new_doctor['id'] = 'STF' . str_pad($new_doctor['id'], 3, '0', STR_PAD_LEFT);
            
            echo json_encode([
                'success' => true,
                'message' => 'Staff member added successfully',
                'data' => $new_doctor
            ]);
        } else {
            throw new Exception("Failed to insert doctor: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add staff member: ' . $e->getMessage()]);
    }
}

function handlePut($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input or missing ID']);
            return;
        }
        
        // Extract numeric ID from formatted ID (STF001 -> 1)
        $doctor_id = (int) substr($input['id'], 3);
        
        // Check if updating status only
        if (isset($input['status']) && count($input) == 2) { // id + status
            $stmt = $conn->prepare("UPDATE doctors SET status = ? WHERE doctor_id = ?");
            $stmt->bind_param("si", $input['status'], $doctor_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Staff status updated successfully'
                ]);
            } else {
                throw new Exception("Failed to update status: " . $stmt->error);
            }
        } else {
            // Full update
            $stmt = $conn->prepare("UPDATE doctors SET name = ?, specialization = ?, email = ?, department = ?, status = ? WHERE doctor_id = ?");
            $stmt->bind_param("sssssi", 
                $input['name'], 
                $input['role'], 
                $input['email'], 
                $input['department'], 
                $input['status'], 
                $doctor_id
            );
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Staff member updated successfully'
                ]);
            } else {
                throw new Exception("Failed to update doctor: " . $stmt->error);
            }
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update staff member: ' . $e->getMessage()]);
    }
}

function handleDelete($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing staff ID']);
            return;
        }
        
        // Extract numeric ID from formatted ID (STF001 -> 1)
        $doctor_id = (int) substr($input['id'], 3);
        
        // Check if doctor has associated records
        $check_stmt = $conn->prepare("SELECT COUNT(*) as count FROM medical_records WHERE doctor_id = ?");
        $check_stmt->bind_param("i", $doctor_id);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        $count = $result->fetch_assoc()['count'];
        
        if ($count > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete staff member with associated medical records']);
            return;
        }
        
        // Start transaction to ensure both doctor and user are deleted together
        $conn->begin_transaction();
        
        try {
            // Get the user_id associated with this doctor
            $user_stmt = $conn->prepare("SELECT user_id FROM doctors WHERE doctor_id = ?");
            $user_stmt->bind_param("i", $doctor_id);
            $user_stmt->execute();
            $user_result = $user_stmt->get_result();
            
            $user_id = null;
            if ($user_result->num_rows > 0) {
                $user_data = $user_result->fetch_assoc();
                $user_id = $user_data['user_id'];
            }
            
            // Delete the doctor
            $stmt = $conn->prepare("DELETE FROM doctors WHERE doctor_id = ?");
            $stmt->bind_param("i", $doctor_id);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete doctor: " . $stmt->error);
            }
            
            // Delete the associated user account if it exists
            if ($user_id) {
                $user_delete_stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
                $user_delete_stmt->bind_param("i", $user_id);
                
                if (!$user_delete_stmt->execute()) {
                    throw new Exception("Failed to delete user account: " . $user_delete_stmt->error);
                }
                $user_delete_stmt->close();
            }
            
            // Commit the transaction
            $conn->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Staff member and associated user account deleted successfully'
            ]);
            
            $stmt->close();
            $user_stmt->close();
            
        } catch (Exception $e) {
            // Rollback the transaction on error
            $conn->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete staff member: ' . $e->getMessage()]);
    }
}

$conn->close();
?>
