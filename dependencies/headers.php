<?php

$headers = [
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: SAMEORIGIN",
    "X-XSS-Protection: 0",
];

if(basename($_SERVER['PHP_SELF']) !== 'index.php') {
    #$headers[] = "Content-Type: application/json";
}

foreach ($headers as $header) {
    header($header);
}
