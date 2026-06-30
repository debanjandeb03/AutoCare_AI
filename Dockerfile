FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the React app and Express server
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]