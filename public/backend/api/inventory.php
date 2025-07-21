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
                    item_id,
                    name,
                    category,
                    stock_quantity as stock,
                    max_stock as maxStock,
                    unit_price,
                    created_at,
                    updated_at
                  FROM inventory 
                  ORDER BY created_at DESC";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception("Database query failed: " . $conn->error);
        }
        
        $inventory = [];
        while ($row = $result->fetch_assoc()) {
            // Format the item ID to match frontend expectations
            $row['id'] = 'INV' . str_pad($row['item_id'], 3, '0', STR_PAD_LEFT);
            // Convert string numbers to integers/floats
            $row['stock'] = (int) $row['stock'];
            $row['maxStock'] = (int) $row['maxStock'];
            $row['unit_price'] = (float) $row['unit_price'];
            unset($row['item_id']); // Remove original item_id
            $inventory[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $inventory
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch inventory: ' . $e->getMessage()]);
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
        $required_fields = ['name', 'category', 'stock', 'maxStock'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }
        
        // Set default unit price if not provided
        $unit_price = isset($input['unit_price']) ? $input['unit_price'] : 0.00;
        
        // Prepare and execute the insert statement
        $stmt = $conn->prepare("INSERT INTO inventory (name, category, stock_quantity, max_stock, unit_price) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssiid", 
            $input['name'], 
            $input['category'], 
            $input['stock'], 
            $input['maxStock'], 
            $unit_price
        );
        
        if ($stmt->execute()) {
            $new_id = $conn->insert_id;
            
            // Fetch the newly created item
            $fetch_stmt = $conn->prepare("SELECT item_id, name, category, stock_quantity as stock, max_stock as maxStock, unit_price, created_at, updated_at FROM inventory WHERE item_id = ?");
            $fetch_stmt->bind_param("i", $new_id);
            $fetch_stmt->execute();
            $result = $fetch_stmt->get_result();
            $new_item = $result->fetch_assoc();
            
            // Format the ID and convert types
            $new_item['id'] = 'INV' . str_pad($new_item['item_id'], 3, '0', STR_PAD_LEFT);
            $new_item['stock'] = (int) $new_item['stock'];
            $new_item['maxStock'] = (int) $new_item['maxStock'];
            $new_item['unit_price'] = (float) $new_item['unit_price'];
            unset($new_item['item_id']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Inventory item added successfully',
                'data' => $new_item
            ]);
        } else {
            throw new Exception("Failed to insert inventory item: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add inventory item: ' . $e->getMessage()]);
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
        
        // Extract numeric ID from formatted ID (INV001 -> 1)
        $item_id = (int) substr($input['id'], 3);
        
        // Check if this is a stock update operation
        if (isset($input['addStock'])) {
            // Adding stock to existing item
            $add_quantity = (int) $input['addStock'];
            
            // Get current stock first
            $check_stmt = $conn->prepare("SELECT stock_quantity, max_stock FROM inventory WHERE item_id = ?");
            $check_stmt->bind_param("i", $item_id);
            $check_stmt->execute();
            $result = $check_stmt->get_result();
            $current = $result->fetch_assoc();
            
            if (!$current) {
                http_response_code(404);
                echo json_encode(['error' => 'Item not found']);
                return;
            }
            
            $new_stock = min($current['stock_quantity'] + $add_quantity, $current['max_stock']);
            
            $stmt = $conn->prepare("UPDATE inventory SET stock_quantity = ? WHERE item_id = ?");
            $stmt->bind_param("ii", $new_stock, $item_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Stock updated successfully',
                    'new_stock' => $new_stock
                ]);
            } else {
                throw new Exception("Failed to update stock: " . $stmt->error);
            }
        } else {
            // Full item update
            $stmt = $conn->prepare("UPDATE inventory SET name = ?, category = ?, stock_quantity = ?, max_stock = ?, unit_price = ? WHERE item_id = ?");
            $stmt->bind_param("ssiidi", 
                $input['name'], 
                $input['category'], 
                $input['stock'], 
                $input['maxStock'], 
                $input['unit_price'], 
                $item_id
            );
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Inventory item updated successfully'
                ]);
            } else {
                throw new Exception("Failed to update inventory item: " . $stmt->error);
            }
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update inventory item: ' . $e->getMessage()]);
    }
}

function handleDelete($conn) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing item ID']);
            return;
        }
        
        // Extract numeric ID from formatted ID (INV001 -> 1)
        $item_id = (int) substr($input['id'], 3);
        
        // Check if item is used in any bill items
        $check_stmt = $conn->prepare("SELECT COUNT(*) as count FROM bill_items WHERE description LIKE CONCAT('%', (SELECT name FROM inventory WHERE item_id = ?), '%')");
        $check_stmt->bind_param("i", $item_id);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        $count = $result->fetch_assoc()['count'];
        
        if ($count > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete item that has been used in billing']);
            return;
        }
        
        // Delete the item
        $stmt = $conn->prepare("DELETE FROM inventory WHERE item_id = ?");
        $stmt->bind_param("i", $item_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Inventory item deleted successfully'
            ]);
        } else {
            throw new Exception("Failed to delete inventory item: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete inventory item: ' . $e->getMessage()]);
    }
}

$conn->close();
?>
