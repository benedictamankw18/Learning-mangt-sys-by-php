<?php

// Handle multiple allowed origins correctly
$allowedOrigins = $_ENV['ALLOWED_ORIGINS'] ?? '*';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$isLocalDevOrigin = false;
if ($origin && preg_match('#^https?://(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$#i', $origin)) {
    $isLocalDevOrigin = true;
}

if ($allowedOrigins === '*') {
    // With credentials enabled below, reflect request origin when available.
    if ($origin) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: *');
    }
} else {
    // Split comma-separated origins and ignore empty values.
    $originsArray = array_values(array_filter(array_map(function ($item) {
        return trim((string) $item, " \t\n\r\0\x0B\"'");
    }, explode(',', $allowedOrigins))));
    $isExplicitlyAllowed = $origin && in_array($origin, $originsArray, true);

    if ($isExplicitlyAllowed) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } elseif ($isLocalDevOrigin) {
        // Allow local frontend dev servers on any localhost port.
        header('Access-Control-Allow-Origin: ' . $origin);
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