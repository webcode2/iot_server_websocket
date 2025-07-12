#!/bin/sh

echo "Running Drizzle migration..."
npx drizzle-kit migrate

echo "🌱 Seeding students..."
node ./src/config/seedStaff.js
node ./src/config/seedStudents.js
node ./src/config/seedBook.js

echo "Starting Node.js app..."
exec node src/app.js
