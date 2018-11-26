<?php

$headers = [
    'X-Frame-Options: SAMEORIGIN',
    'X-XSS-Protection: 1; mode=block',
];

if(basename($_SERVER['PHP_SELF']) !== 'index.php') {
    $headers[] = 'Content-Type: application/json';
}

foreach ($headers as $header) {
    header($header);
}
