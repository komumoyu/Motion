<?php
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendSuccess($message, $data = null) {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendResponse($response, 200);
}

function sendError($message, $statusCode = 400) {
    $response = ['success' => false, 'error' => $message];
    sendResponse($response, $statusCode);
}