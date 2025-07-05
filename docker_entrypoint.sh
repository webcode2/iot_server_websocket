#!/bin/sh

echo "Running Drizzle migration..."
npx drizzle-kit migrate

echo "🌱 Seeding students..."
node ./src/utils/seedStudents.js

echo "Starting Node.js app..."
exec node src/app.js
