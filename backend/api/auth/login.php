<?php
require_once '../../config/database.php';
require_once '../../models/User.php';
require_once '../../utils/response.php';

// Handle CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST');
    exit(0);
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    sendError('Email and password are required', 400);
}

$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    sendError('Invalid email format', 400);
}

try {
    $user = new User($db);
    $userData = $user->findByEmail($email);

    if (!$userData || !$user->verifyPassword($input['password'], $userData['password'])) {
        sendError('Invalid credentials', 401);
    }

    // Start session
    session_start();
    $_SESSION['user_id'] = $userData['id'];
    $_SESSION['user'] = [
        'id' => $userData['id'],
        'email' => $userData['email'],
        'name' => $userData['name']
    ];

    // Return user data (without password)
    unset($userData['password']);
    sendSuccess('Login successful', ['user' => $userData]);

} catch (Exception $e) {
    sendError('Login failed: ' . $e->getMessage(), 500);
}