<?php

// Handle multiple allowed origins correctly
$allowedOrigins = $_ENV['ALLOWED_ORIGINS'] ?? '*';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($allowedOrigins === '*') {
    header('Access-Control-Allow-Origin: *');
} else {
    // Split the comma-separated origins
    $originsArray = array_map('trim', explode(',', $allowedOrigins));

    // Check if the request origin is in the allowed list
    if (in_array($origin, $originsArray)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        // Default to first origin if no match
        header('Access-Control-Allow-Origin: ' . $originsArray[0]);
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
