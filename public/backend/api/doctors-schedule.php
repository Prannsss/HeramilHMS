<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Include database connection
require_once '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if connection exists
        if (!isset($conn) || $conn->connect_error) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Database connection failed'
            ]);
            exit;
        }
        
        // Get all active doctors with their departments
        $doctors_query = "
            SELECT 
                doctor_id,
                name,
                department,
                specialization
            FROM doctors 
            WHERE status = 'Active'
            ORDER BY department, name
        ";
        
        $doctors_result = $conn->query($doctors_query);
        
        if (!$doctors_result) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Database query failed: ' . $conn->error
            ]);
            exit;
        }
        
        $doctors_by_department = [];
        $all_doctors = [];
        
        while ($row = $doctors_result->fetch_assoc()) {
            // Default available times (can be customized later with a schedule table)
            $available_times = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
            
            $doctor = [
                'id' => $row['doctor_id'],
                'name' => $row['name'],
                'department' => $row['department'],
                'specialization' => $row['specialization'],
                'availableTimes' => $available_times
            ];
            
            $all_doctors[] = $doctor;
            
            // Group by department
            if (!isset($doctors_by_department[$row['department']])) {
                $doctors_by_department[$row['department']] = [];
            }
            $doctors_by_department[$row['department']][] = $doctor;
        }
        
        // Get unique departments
        $departments = array_keys($doctors_by_department);
        sort($departments);
        
        echo json_encode([
            'status' => 'success',
            'data' => [
                'doctors' => $all_doctors,
                'departments' => $departments,
                'doctors_by_department' => $doctors_by_department
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Exception occurred: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Only GET method is allowed'
    ]);
}

// Close connection if it exists
if (isset($conn)) {
    $conn->close();
}
?>
