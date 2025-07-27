#!/bin/sh

echo "Running Drizzle migration..."
npx drizzle-kit migrate



echo "Starting Node.js app..."
exec node src/app.js
