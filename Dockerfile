

# Use official Node.js image
FROM node:23.11.0-alpine

# Create app directory
WORKDIR /usr/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh ./

# Make it executable
RUN chmod +x ./docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Run the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
