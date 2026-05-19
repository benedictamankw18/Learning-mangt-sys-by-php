<?php
// Bulk replace error_log( -> log_error( across src/, skipping Logger.php and vendor
$base = __DIR__ . '/../src';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
$modified = 0;
foreach ($iterator as $file) {
    if (!$file->isFile()) continue;
    $path = $file->getPathname();
    if (stripos($path, 'Logger.php') !== false) continue; // skip Logger
    if (stripos($path, DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR) !== false) continue;
    if (substr($path, -4) !== '.php') continue;

    $contents = file_get_contents($path);
    if (strpos($contents, 'error_log(') !== false) {
        $new = str_replace('error_log(', 'log_error(', $contents);
        file_put_contents($path, $new);
        echo "Updated: $path\n";
        $modified++;
    }
}

echo "Done. Modified $modified files.\n";
