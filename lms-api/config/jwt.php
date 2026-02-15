<?php

return [
    'secret' => $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this',
    'issuer' => $_ENV['JWT_ISSUER'] ?? 'lms-api',
    'audience' => $_ENV['JWT_AUDIENCE'] ?? 'lms-client',
    'access_expiry' => (int) ($_ENV['JWT_ACCESS_EXPIRY'] ?? 3600),
    'refresh_expiry' => (int) ($_ENV['JWT_REFRESH_EXPIRY'] ?? 604800),
    'algorithm' => 'HS256'
];
