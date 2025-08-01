<?php
// Helper function to get doctor ID from authentication
function getDoctorIdFromAuth() {
    // In a real application, this would get the doctor_id from the session or JWT token
    // For now, we'll check if it's passed as a query parameter or header
    
    // Check for doctor_id in query parameters (temporary solution for development)
    if (isset($_GET['doctor_id'])) {
        return intval($_GET['doctor_id']);
    }
    
    // Check for doctor_id in POST data
    if (isset($_POST['doctor_id'])) {
        return intval($_POST['doctor_id']);
    }
    
    // Check for doctor_id in JSON body
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['doctor_id'])) {
        return intval($input['doctor_id']);
    }
    
    // Check for authorization header (future implementation for JWT)
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        // TODO: Implement JWT token decoding to get doctor_id
        // For now, return null
    }
    
    // If no doctor_id found, return null (should handle this as unauthorized)
    return null;
}

// Function to validate that the doctor exists and is active
function validateDoctor($conn, $doctor_id) {
    if ($doctor_id === null) {
        return false;
    }
    
    $stmt = $conn->prepare("SELECT doctor_id FROM doctors WHERE doctor_id = ? AND status = 'Active'");
    $stmt->bind_param("i", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->num_rows === 1;
}

// Function to get doctor information
function getDoctorInfo($conn, $doctor_id) {
    $stmt = $conn->prepare("SELECT doctor_id, name, specialization, department, email FROM doctors WHERE doctor_id = ? AND status = 'Active'");
    $stmt->bind_param("i", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        return $result->fetch_assoc();
    }
    
    return null;
}
?>
