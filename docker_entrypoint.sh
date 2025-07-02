#!/bin/sh

echo "Running Drizzle migration..."
exec drizzle-kit migrate

echo "Starting Node.js app..."
exec node src/app.js
