<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../db_connect.php';

function getAvailableRooms($conn, $floor = null) {
    $sql = "SELECT room_id, room_number, floor 
            FROM rooms 
            WHERE status = 'Vacant'";
    
    $params = [];
    $types = "";
    
    if ($floor !== null) {
        $sql .= " AND floor = ?";
        $params[] = $floor;
        $types .= "i";
    }
    
    $sql .= " ORDER BY floor, room_number";
    
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rooms = [];
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $rooms[] = [
                'room_id' => intval($row['room_id']),
                'room_number' => $row['room_number'],
                'floor' => intval($row['floor'])
            ];
        }
    }
    
    return $rooms;
}

function getAvailableRoomsByFloor($conn) {
    $rooms = getAvailableRooms($conn);
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

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $floor = isset($_GET['floor']) ? intval($_GET['floor']) : null;
            $groupByFloor = isset($_GET['groupByFloor']) && $_GET['groupByFloor'] === 'true';
            $forDropdown = isset($_GET['forDropdown']) && $_GET['forDropdown'] === 'true';
            
            if ($forDropdown) {
                // Get all floors for dropdown
                $floors_query = "SELECT DISTINCT floor FROM rooms ORDER BY floor";
                $floors_result = $conn->query($floors_query);
                $floors = [];
                
                while ($row = $floors_result->fetch_assoc()) {
                    $floors[] = [
                        'value' => $row['floor'],
                        'label' => 'Floor ' . $row['floor']
                    ];
                }
                
                $rooms_query = "
                    SELECT 
                        r.room_id,
                        r.room_number,
                        r.floor,
                        r.status
                    FROM rooms r
                    WHERE r.status = 'Vacant'
                    ORDER BY r.floor, r.room_number
                ";
                
                $rooms_result = $conn->query($rooms_query);
                $rooms_by_floor = [];
                
                while ($row = $rooms_result->fetch_assoc()) {
                    $floor_num = $row['floor'];
                    if (!isset($rooms_by_floor[$floor_num])) {
                        $rooms_by_floor[$floor_num] = [];
                    }
                    $rooms_by_floor[$floor_num][] = [
                        'value' => $row['room_number'],
                        'label' => 'Room ' . $row['room_number'],
                        'room_id' => $row['room_id']
                    ];
                }
                
                $response = [
                    'success' => true,
                    'data' => [
                        'floors' => $floors,
                        'rooms_by_floor' => $rooms_by_floor
                    ]
                ];
            } else if ($groupByFloor) {
                $response = [
                    'success' => true,
                    'data' => getAvailableRoomsByFloor($conn)
                ];
            } else {
                $response = [
                    'success' => true,
                    'data' => getAvailableRooms($conn, $floor)
                ];
            }
            
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch available rooms: ' . $e->getMessage()
            ]);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed'
        ]);
        break;
}

$conn->close();
?>
