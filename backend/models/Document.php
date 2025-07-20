<?php
class Document {
    private $conn;
    private $table_name = "documents";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . "
                SET user_id=:user_id, 
                    title=:title, 
                    content=:content,
                    parent_document_id=:parent_document_id";

        $stmt = $this->conn->prepare($query);

        // Bind values
        $stmt->bindParam(":user_id", $data['user_id']);
        $stmt->bindParam(":title", $data['title']);
        $stmt->bindParam(":content", $data['content']);
        $stmt->bindParam(":parent_document_id", $data['parent_document_id']);

        if($stmt->execute()) {
            return [
                'id' => $this->conn->lastInsertId(),
                'user_id' => $data['user_id'],
                'title' => $data['title'],
                'content' => $data['content'],
                'parent_document_id' => $data['parent_document_id'],
                'is_archived' => false,
                'is_published' => false,
                'created_at' => date('Y-m-d H:i:s')
            ];
        }

        return false;
    }

    public function findByUser($userId, $includeArchived = false) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE user_id = :user_id";
        
        if (!$includeArchived) {
            $query .= " AND is_archived = false";
        }
        
        $query .= " ORDER BY updated_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById($id, $userId) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE id = :id AND user_id = :user_id
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update($id, $userId, $data) {
        $fields = [];
        $params = [':id' => $id, ':user_id' => $userId];

        // Build dynamic update query
        foreach (['title', 'content', 'is_archived', 'is_published', 'parent_document_id', 'cover_image', 'icon'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE " . $this->table_name . "
                SET " . implode(', ', $fields) . "
                WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute($params);
    }

    public function delete($id, $userId) {
        $query = "DELETE FROM " . $this->table_name . "
                WHERE id = :id AND user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $userId);

        return $stmt->execute();
    }

    public function getChildren($parentId, $userId) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE parent_document_id = :parent_id 
                AND user_id = :user_id 
                AND is_archived = false
                ORDER BY title ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':parent_id', $parentId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}