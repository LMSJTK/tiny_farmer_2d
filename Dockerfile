# Use a Node.js 20 base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json to install dependencies first (leverages Docker cache)
COPY package.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port configured in vite.config.ts
EXPOSE 3000

# Run the development server as defined in package.json
CMD ["npm", "run", "dev"]
