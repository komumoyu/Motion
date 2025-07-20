<?php
require_once '../../middleware/auth.php';
require_once '../../utils/response.php';

// Handle CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

$user = authenticate();

if ($user) {
    sendSuccess('Authenticated', ['user' => $user]);
} else {
    sendSuccess('Not authenticated', ['user' => null]);
}