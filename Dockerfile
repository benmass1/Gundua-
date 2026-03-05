# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
