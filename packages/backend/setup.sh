#!/bin/bash

# TalentBinder Backend Setup Script
# This script is called during deployment to setup/restart the backend service

set -e

NAME="talentbinder-backend"
SERVICE_FILE="/etc/systemd/system/$NAME.service"
APP_DIR=$(pwd)  # Current directory (deployment directory)

echo "Setting up TalentBinder Backend..."
echo "App Directory: $APP_DIR"

# Service configuration
SERVICE_CONTENT="[Unit]
Description=TalentBinder Backend Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/dist/index.js
Restart=on-failure
RestartSec=10s
StartLimitInterval=1m
StartLimitBurst=5

# Environment
Environment='NODE_ENV=production'
Environment='PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$NAME

[Install]
WantedBy=multi-user.target
"

# Create systemd service file if it doesn't exist
if [ ! -f "$SERVICE_FILE" ]; then
    echo "Creating systemd service file..."
    echo "$SERVICE_CONTENT" | sudo tee "$SERVICE_FILE" > /dev/null
    sudo systemctl daemon-reload
    sudo systemctl enable $NAME.service
    echo "Service file created and enabled"
else
    echo "Service file already exists"
    sudo systemctl daemon-reload
fi

# Install production dependencies
if [ -f "$APP_DIR/package.json" ]; then
    echo "Installing production dependencies..."
    sudo npm ci --omit=dev
fi

# Check for .env file
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Warning: No .env file found!"
    if [ -f "$APP_DIR/.env.render" ]; then
        echo "Copying .env.render to .env"
        sudo cp "$APP_DIR/.env.render" "$APP_DIR/.env"
    fi
fi

# Restart the service
if sudo systemctl is-active --quiet $NAME.service; then
    echo "Restarting $NAME service..."
    sudo systemctl restart $NAME.service
else
    echo "Starting $NAME service..."
    sudo systemctl start $NAME.service
fi

# Wait and check status
sleep 2
if sudo systemctl is-active --quiet $NAME.service; then
    echo "✓ $NAME service is running"
    sudo systemctl status $NAME.service --no-pager --lines=0
else
    echo "✗ $NAME service failed to start"
    sudo systemctl status $NAME.service --no-pager
    exit 1
fi

echo "Backend setup complete!"
