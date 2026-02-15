<?php

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Config\Database;

try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();

    echo "Environment loaded\n";
    echo "DB_HOST: " . $_ENV['DB_HOST'] . "\n";
    echo "DB_NAME: " . $_ENV['DB_NAME'] . "\n";
    echo "DB_USER: " . $_ENV['DB_USER'] . "\n\n";

    $db = Database::getInstance()->getConnection();
    echo "Database connected successfully!\n\n";

    // Test query
    $stmt = $db->query("SELECT user_id, username, email FROM users WHERE username = 'admin'");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo "Found user:\n";
        print_r($user);
    } else {
        echo "No user found\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
