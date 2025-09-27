<?php
function getDoctorIdFromAuth() {
    if (isset($_GET['doctor_id'])) {
        return intval($_GET['doctor_id']);
    }
    
    if (isset($_POST['doctor_id'])) {
        return intval($_POST['doctor_id']);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['doctor_id'])) {
        return intval($input['doctor_id']);
    }
    
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
    }
    
    return null;
}

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
