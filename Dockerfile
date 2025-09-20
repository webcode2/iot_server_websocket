

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
COPY docker_entrypoint.sh ./

# Make it executable
RUN chmod +x ./docker_entrypoint.sh

# Expose port
EXPOSE 4000

# Run the entrypoint script
ENTRYPOINT ["./docker_entrypoint.sh"]
# CMD ["sh", "-c", "npm run seed && npm run dev"]
