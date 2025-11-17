#!/bin/bash

# TalentBinder Backend Service Setup Script
# This script creates and manages a systemd service for the TalentBinder backend

# Variables
NAME="talentbinder-backend"
SERVICE_FILE="/etc/systemd/system/$NAME.service"
APP_DIR="/var/www/$NAME"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Function to display an error message and exit
function error_exit {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to display success message
function success_msg {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to display warning message
function warning_msg {
    echo -e "${YELLOW}! $1${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   error_exit "This script must be run as root or with sudo"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error_exit "Node.js is not installed. Please install Node.js 18 or higher."
fi

NODE_VERSION=$(node -v)
success_msg "Node.js version: $NODE_VERSION"

# Create app directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    warning_msg "App directory $APP_DIR does not exist. Creating it..."
    mkdir -p "$APP_DIR" || error_exit "Failed to create app directory."
    success_msg "Created app directory: $APP_DIR"
fi

# Check if the systemd service file exists; create it if not
if [ ! -f "$SERVICE_FILE" ]; then
    echo "Creating systemd service file: $SERVICE_FILE..."

    echo "$SERVICE_CONTENT" | tee "$SERVICE_FILE" > /dev/null || error_exit "Failed to create systemd service file."

    # Reload systemd and enable the service
    systemctl daemon-reload || error_exit "Failed to reload systemd."
    systemctl enable $NAME.service || error_exit "Failed to enable $NAME service."
    success_msg "Systemd service file created and enabled."
else
    success_msg "Systemd service file already exists."
    
    # Reload systemd in case service file was modified externally
    systemctl daemon-reload || error_exit "Failed to reload systemd."
fi

# Check if the service is active
if systemctl is-active --quiet $NAME.service; then
    echo "Service $NAME.service is already running. Restarting it..."
    systemctl restart $NAME.service || error_exit "Failed to restart $NAME service."
    success_msg "Service restarted."
else
    echo "Service $NAME.service is not active. Starting it..."
    systemctl start $NAME.service || error_exit "Failed to start $NAME service."
    success_msg "Service started."
fi

# Ensure the service is enabled
if ! systemctl is-enabled --quiet $NAME.service; then
    echo "Enabling $NAME.service..."
    systemctl enable $NAME.service || error_exit "Failed to enable $NAME service."
    success_msg "Service enabled."
else
    success_msg "Service $NAME.service is already enabled."
fi

# Display service status
echo ""
echo "========================================"
echo "Service Status:"
echo "========================================"
systemctl status $NAME.service --no-pager

echo ""
success_msg "Setup complete! The TalentBinder backend service is running."
echo ""
echo "Useful commands:"
echo "  - Check status:  sudo systemctl status $NAME"
echo "  - View logs:     sudo journalctl -u $NAME -f"
echo "  - Restart:       sudo systemctl restart $NAME"
echo "  - Stop:          sudo systemctl stop $NAME"
echo "  - Start:         sudo systemctl start $NAME"
