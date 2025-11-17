#!/bin/bash

# TalentBinder Frontend Setup Script
# This script is called during deployment to setup the frontend

set -e

APP_DIR=$(pwd)  # Current directory (deployment directory)

echo "Setting up TalentBinder Frontend..."
echo "App Directory: $APP_DIR"

# Set correct permissions for web server
echo "Setting permissions..."
sudo chown -R www-data:www-data "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

# Reload web server
if systemctl is-active --quiet nginx; then
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
elif systemctl is-active --quiet apache2; then
    echo "Reloading apache2..."
    sudo systemctl reload apache2
    echo "✓ Apache2 reloaded"
else
    echo "Warning: No web server (nginx/apache2) detected"
fi

echo "Frontend setup complete!"
