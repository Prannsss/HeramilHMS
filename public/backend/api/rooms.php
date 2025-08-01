<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../db_connect.php';

function syncRoomStatusWithPatients($conn) {
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Set all rooms with discharged patients to vacant
        $sql1 = "UPDATE rooms r 
                 JOIN patients p ON r.patient_id = p.patient_id 
                 SET r.status = 'Vacant', r.patient_id = NULL 
                 WHERE p.status = 'Discharged'";
        $conn->query($sql1);
        
        // Update patient room info to N/A when they are discharged
        $sql2 = "UPDATE patients 
                 SET floor_number = 'N/A', room_number = 'N/A' 
                 WHERE status = 'Discharged' AND (floor_number != 'N/A' OR room_number != 'N/A')";
        $conn->query($sql2);
        
        // Set rooms with admitted patients to occupied (if they have room assignments)
        $sql3 = "UPDATE rooms r
                 JOIN patients p ON r.patient_id = p.patient_id
                 SET r.status = 'Occupied'
                 WHERE p.status = 'Admitted' AND r.status != 'Occupied'";
        $conn->query($sql3);
        
        // Handle cases where patients are admitted with room assignments but rooms table wasn't updated
        // Find admitted patients with room assignments that don't have corresponding room entries
        $sql4 = "UPDATE rooms r
                 JOIN patients p ON r.room_number = p.room_number AND r.floor = p.floor_number
                 SET r.status = 'Occupied', r.patient_id = p.patient_id
                 WHERE p.status = 'Admitted' 
                 AND p.floor_number != 'N/A' 
                 AND p.room_number != 'N/A'
                 AND (r.patient_id IS NULL OR r.patient_id != p.patient_id)
                 AND r.status = 'Vacant'";
        $conn->query($sql4);
        
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

function getRoomsWithOccupancy($conn) {
    // First, sync room status based on admitted patients
    syncRoomStatusWithPatients($conn);
    
    $sql = "SELECT 
                r.room_id,
                r.room_number,
                r.floor,
                r.status,
                r.patient_id,
                p.name as patient_name,
                p.date_of_admission,
                p.reason_for_admission
            FROM rooms r
            LEFT JOIN patients p ON r.patient_id = p.patient_id AND p.status = 'Admitted'
            ORDER BY r.floor, r.room_number";
    
    $result = $conn->query($sql);
    $rooms = [];
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $room = [
                'id' => intval($row['room_id']),
                'room_number' => $row['room_number'],
                'floor' => intval($row['floor']),
                'status' => $row['status']
            ];
            
            // Add occupant details if room is occupied and has an admitted patient
            if ($row['patient_id'] && $row['status'] === 'Occupied' && $row['patient_name']) {
                $room['occupant'] = [
                    'id' => 'PAT' . str_pad($row['patient_id'], 3, '0', STR_PAD_LEFT),
                    'name' => $row['patient_name'],
                    'dateOfAdmission' => $row['date_of_admission'],
                    'reasonForAdmission' => $row['reason_for_admission']
                ];
            }
            
            $rooms[] = $room;
        }
    }
    
    return $rooms;
}

function getRoomsByFloor($rooms) {
    $floors = [];
    
    foreach ($rooms as $room) {
        $floorNum = $room['floor'];
        
        if (!isset($floors[$floorNum])) {
            $floors[$floorNum] = [
                'floor' => $floorNum,
                'rooms' => []
            ];
        }
        
        $floors[$floorNum]['rooms'][] = $room;
    }
    
    return array_values($floors);
}

function updateRoomStatus($conn, $roomId, $status, $patientId = null) {
    $sql = "UPDATE rooms SET status = ?, patient_id = ? WHERE room_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sii", $status, $patientId, $roomId);
    
    return $stmt->execute();
}

function vacateRoom($conn, $roomId) {
    // First check if there's an admitted patient in the room
    $checkPatient = "SELECT p.patient_id, p.status, p.name 
                     FROM rooms r 
                     LEFT JOIN patients p ON r.patient_id = p.patient_id 
                     WHERE r.room_id = ? AND r.patient_id IS NOT NULL";
    $stmt = $conn->prepare($checkPatient);
    $stmt->bind_param("i", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $patient = $result->fetch_assoc();
        if ($patient['status'] === 'Admitted') {
            return ['error' => 'Cannot vacate room. Patient is still admitted. Please discharge the patient first.', 'patient_name' => $patient['name']];
        }
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Get the patient_id before clearing the room
        $getPatientStmt = $conn->prepare("SELECT patient_id FROM rooms WHERE room_id = ?");
        $getPatientStmt->bind_param("i", $roomId);
        $getPatientStmt->execute();
        $patientResult = $getPatientStmt->get_result();
        
        $patient_id = null;
        if ($patientResult->num_rows > 0) {
            $patientData = $patientResult->fetch_assoc();
            $patient_id = $patientData['patient_id'];
        }
        
        // Clear the room
        $sql = "UPDATE rooms SET status = 'Vacant', patient_id = NULL WHERE room_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $roomId);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to vacate room');
        }
        
        // Update patient's room information if there was a patient
        if ($patient_id) {
            $updatePatientStmt = $conn->prepare("UPDATE patients SET floor_number = 'N/A', room_number = 'N/A' WHERE patient_id = ?");
            $updatePatientStmt->bind_param("i", $patient_id);
            
            if (!$updatePatientStmt->execute()) {
                throw new Exception('Failed to update patient room information');
            }
        }
        
        $conn->commit();
        return true;
    } catch (Exception $e) {
        $conn->rollback();
        return ['error' => 'Failed to vacate room: ' . $e->getMessage()];
    }
}

function assignPatientToRoom($conn, $roomId, $patientId) {
    // First check if patient exists and is admitted
    $checkPatient = "SELECT patient_id FROM patients WHERE patient_id = ? AND status = 'Admitted'";
    $stmt = $conn->prepare($checkPatient);
    $stmt->bind_param("i", $patientId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['error' => 'Patient not found or not admitted'];
    }
    
    // Check if room is vacant and get room details
    $checkRoom = "SELECT room_id, room_number, floor FROM rooms WHERE room_id = ? AND status = 'Vacant'";
    $stmt = $conn->prepare($checkRoom);
    $stmt->bind_param("i", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['error' => 'Room not found or not vacant'];
    }
    
    $roomData = $result->fetch_assoc();
    $room_number = $roomData['room_number'];
    $floor = $roomData['floor'];
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Assign patient to room
        if (!updateRoomStatus($conn, $roomId, 'Occupied', $patientId)) {
            throw new Exception('Failed to update room status');
        }
        
        // Update patient's room information
        $updatePatient = "UPDATE patients SET floor_number = ?, room_number = ? WHERE patient_id = ?";
        $stmt = $conn->prepare($updatePatient);
        $stmt->bind_param("isi", $floor, $room_number, $patientId);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to update patient room information');
        }
        
        $conn->commit();
        return ['success' => true];
    } catch (Exception $e) {
        $conn->rollback();
        return ['error' => 'Failed to assign patient to room: ' . $e->getMessage()];
    }
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $rooms = getRoomsWithOccupancy($conn);
            $floors = getRoomsByFloor($rooms);
            
            // Calculate statistics
            $totalRooms = count($rooms);
            $occupiedRooms = count(array_filter($rooms, function($room) {
                return $room['status'] === 'Occupied';
            }));
            $vacantRooms = $totalRooms - $occupiedRooms;
            
            $response = [
                'floors' => $floors,
                'statistics' => [
                    'totalRooms' => $totalRooms,
                    'occupiedRooms' => $occupiedRooms,
                    'vacantRooms' => $vacantRooms
                ]
            ];
            
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch rooms data: ' . $e->getMessage()]);
        }
        break;
    
    case 'PUT':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['room_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Room ID is required']);
                break;
            }
            
            $roomId = intval($input['room_id']);
            
            if (isset($input['action'])) {
                switch ($input['action']) {
                    case 'vacate':
                        $result = vacateRoom($conn, $roomId);
                        if (is_array($result) && isset($result['error'])) {
                            http_response_code(400);
                            echo json_encode($result);
                        } else if ($result) {
                            echo json_encode(['success' => true, 'message' => 'Room vacated successfully']);
                        } else {
                            http_response_code(500);
                            echo json_encode(['error' => 'Failed to vacate room']);
                        }
                        break;
                    
                    case 'assign':
                        if (!isset($input['patient_id'])) {
                            http_response_code(400);
                            echo json_encode(['error' => 'Patient ID is required for assignment']);
                            break;
                        }
                        
                        $result = assignPatientToRoom($conn, $roomId, intval($input['patient_id']));
                        if (isset($result['error'])) {
                            http_response_code(400);
                            echo json_encode($result);
                        } else {
                            echo json_encode(['success' => true, 'message' => 'Patient assigned to room successfully']);
                        }
                        break;
                    
                    default:
                        http_response_code(400);
                        echo json_encode(['error' => 'Invalid action']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Action is required']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update room: ' . $e->getMessage()]);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

$conn->close();
?>
