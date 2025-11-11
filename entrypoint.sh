#!/bin/sh
set -e

# Use the PORT environment variable if it's set, otherwise default to 8080.
PORT=${PORT:-8080}

exec node cli.js --headless --port $PORT
