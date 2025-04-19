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

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "src/app.js"]