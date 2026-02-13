FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files first (better caching)
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Port used by admin
EXPOSE 5112
