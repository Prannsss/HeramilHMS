<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $dashboard_data = [];
        
        // Get total patients count
        $patients_query = "SELECT COUNT(*) as total_patients FROM patients";
        $patients_result = $conn->query($patients_query);
        $dashboard_data['total_patients'] = $patients_result->fetch_assoc()['total_patients'];
        
        // Get appointments today count
        $today = date('Y-m-d');
        $appointments_today_query = "SELECT COUNT(*) as appointments_today FROM appointments WHERE DATE(appointment_datetime) = ?";
        $stmt = $conn->prepare($appointments_today_query);
        $stmt->bind_param("s", $today);
        $stmt->execute();
        $appointments_today_result = $stmt->get_result();
        $dashboard_data['appointments_today'] = $appointments_today_result->fetch_assoc()['appointments_today'];
        
        // Get doctors count (assuming all doctors are on duty)
        $doctors_query = "SELECT COUNT(*) as total_doctors FROM doctors";
        $doctors_result = $conn->query($doctors_query);
        $dashboard_data['total_doctors'] = $doctors_result->fetch_assoc()['total_doctors'];
        
        // Calculate occupancy rate (placeholder calculation - you can adjust based on your needs)
        // For now, let's calculate based on appointment density
        $total_appointments_query = "SELECT COUNT(*) as total_appointments FROM appointments WHERE DATE(appointment_datetime) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        $total_appointments_result = $conn->query($total_appointments_query);
        $total_appointments = $total_appointments_result->fetch_assoc()['total_appointments'];
        $occupancy_rate = min(100, ($total_appointments / 70) * 100); // Assuming 10 appointments per day * 7 days = 70 max
        $dashboard_data['occupancy_rate'] = round($occupancy_rate, 1);
        
        // Get recent appointments (last 10)
        $recent_appointments_query = "
            SELECT 
                a.appointment_id,
                a.appointment_datetime,
                a.reason,
                a.status,
                p.name as patient_name,
                p.contact_number as patient_contact,
                d.name as doctor_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.doctor_id
            ORDER BY a.appointment_datetime DESC
            LIMIT 10
        ";
        
        $recent_appointments_result = $conn->query($recent_appointments_query);
        $recent_appointments = [];
        
        while ($row = $recent_appointments_result->fetch_assoc()) {
            $appointment_date = date('Y-m-d', strtotime($row['appointment_datetime']));
            $appointment_time = date('h:i A', strtotime($row['appointment_datetime']));
            
            // Generate email from name if contact is just a phone number
            $email = $row['patient_contact'];
            if (preg_match('/^[\d\s\-\+\(\)]+$/', $email)) {
                // If it's just a phone number, generate an email
                $email = strtolower(str_replace(' ', '.', $row['patient_name'])) . '@email.com';
            }
            
            $recent_appointments[] = [
                'id' => $row['appointment_id'],
                'patient' => [
                    'name' => $row['patient_name'],
                    'contact' => $row['patient_contact'],
                    'email' => $email
                ],
                'doctor' => $row['doctor_name'],
                'date' => $appointment_date,
                'time' => $appointment_time,
                'status' => $row['status'],
                'reason' => $row['reason']
            ];
        }
        
        $dashboard_data['recent_appointments'] = $recent_appointments;
        
        echo json_encode([
            'status' => 'success',
            'data' => $dashboard_data
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to fetch dashboard data: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
}

$conn->close();
?>
