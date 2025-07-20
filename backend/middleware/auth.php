<?php
session_start();

function authenticate() {
    // Check if user is logged in via session
    if (isset($_SESSION['user_id']) && isset($_SESSION['user'])) {
        return $_SESSION['user'];
    }

    // Alternative: Check for JWT token in Authorization header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        // Validate JWT token here if using JWT
        // return validateJWT($token);
    }

    return false;
}

function requireAuth() {
    $user = authenticate();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    return $user;
}