#!/bin/bash
amazon-linux-extras enable nginx1
amazon-linux-extras install -y nginx1

cat - << 'EOS' > /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        location / {
            try_files $uri $uri/ =404;
        }
    }

    server {
        listen 80;
        server_name example.com;
        root /var/www;
        location / {
            try_files $uri $uri/ =404;
        }
    }
}
EOS

cat - << 'EOS' > /usr/share/nginx/html/index.html
<h1><default</h1>
EOS

mkdir -p /var/www
cat - << 'EOS' > /var/www/index.html
<h1><example.com</h1>
EOS

service nginx start