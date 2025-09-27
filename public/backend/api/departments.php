<?php
require_once '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

function sendResponse($success, $data = null, $error = null) {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'error' => $error
    ]);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            $query = "SELECT department_id, name, description, roles, status, created_at, updated_at FROM departments ORDER BY name ASC";
            $result = $conn->query($query);
            
            if ($result === false) {
                throw new Exception("Database query failed: " . $conn->error);
            }
            
            $departments = [];
            while ($row = $result->fetch_assoc()) {
                $departments[] = [
                    'id' => $row['department_id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'roles' => $row['roles'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            
            sendResponse(true, $departments);
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }
            
            $name = trim($input['name'] ?? '');
            $description = trim($input['description'] ?? '');
            $roles = trim($input['roles'] ?? '');
            $status = $input['status'] ?? 'Active';
            
            if (empty($name)) {
                throw new Exception('Department name is required');
            }
            
            if (empty($roles)) {
                throw new Exception('Department roles are required');
            }
            
            if (strlen($name) > 100) {
                throw new Exception('Department name must be 100 characters or less');
            }
            
            $check_query = "SELECT department_id FROM departments WHERE name = ?";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("s", $name);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows > 0) {
                throw new Exception('Department with this name already exists');
            }
            
            $insert_query = "INSERT INTO departments (name, description, roles, status) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($insert_query);
            $stmt->bind_param("ssss", $name, $description, $roles, $status);
            
            if ($stmt->execute()) {
                $department_id = $conn->insert_id;
                
                $select_query = "SELECT department_id, name, description, roles, status, created_at, updated_at FROM departments WHERE department_id = ?";
                $select_stmt = $conn->prepare($select_query);
                $select_stmt->bind_param("i", $department_id);
                $select_stmt->execute();
                $result = $select_stmt->get_result();
                $department = $result->fetch_assoc();
                
                $responseData = [
                    'id' => $department['department_id'],
                    'name' => $department['name'],
                    'description' => $department['description'],
                    'roles' => $department['roles'],
                    'status' => $department['status'],
                    'created_at' => $department['created_at'],
                    'updated_at' => $department['updated_at']
                ];
                
                sendResponse(true, $responseData);
            } else {
                throw new Exception('Failed to create department');
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }
            
            $department_id = intval($input['id'] ?? 0);
            $name = trim($input['name'] ?? '');
            $description = trim($input['description'] ?? '');
            $roles = trim($input['roles'] ?? '');
            $status = $input['status'] ?? 'Active';
            
            if ($department_id <= 0) {
                throw new Exception('Valid department ID is required');
            }
            
            if (empty($name)) {
                throw new Exception('Department name is required');
            }
            
            if (empty($roles)) {
                throw new Exception('Department roles are required');
            }
            
            if (strlen($name) > 100) {
                throw new Exception('Department name must be 100 characters or less');
            }
            
            $check_query = "SELECT department_id FROM departments WHERE name = ? AND department_id != ?";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param("si", $name, $department_id);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows > 0) {
                throw new Exception('Department with this name already exists');
            }
            
            $update_query = "UPDATE departments SET name = ?, description = ?, roles = ?, status = ?, updated_at = NOW() WHERE department_id = ?";
            $stmt = $conn->prepare($update_query);
            $stmt->bind_param("ssssi", $name, $description, $roles, $status, $department_id);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(true, ['message' => 'Department updated successfully']);
                } else {
                    throw new Exception('Department not found or no changes made');
                }
            } else {
                throw new Exception('Failed to update department');
            }
            break;
            
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }
            
            $department_id = intval($input['id'] ?? 0);
            
            if ($department_id <= 0) {
                throw new Exception('Valid department ID is required');
            }
            
            $check_usage_query = "SELECT COUNT(*) as count FROM doctors WHERE department = (SELECT name FROM departments WHERE department_id = ?)";
            $check_stmt = $conn->prepare($check_usage_query);
            $check_stmt->bind_param("i", $department_id);
            $check_stmt->execute();
            $result = $check_stmt->get_result();
            $usage = $result->fetch_assoc();
            
            if ($usage['count'] > 0) {
                throw new Exception('Cannot delete department that has staff members assigned to it');
            }
            
            $delete_query = "DELETE FROM departments WHERE department_id = ?";
            $stmt = $conn->prepare($delete_query);
            $stmt->bind_param("i", $department_id);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(true, ['message' => 'Department deleted successfully']);
                } else {
                    throw new Exception('Department not found');
                }
            } else {
                throw new Exception('Failed to delete department');
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    error_log("Departments API Error: " . $e->getMessage());
    sendResponse(false, null, $e->getMessage());
}
?>