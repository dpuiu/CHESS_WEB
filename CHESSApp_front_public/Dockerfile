FROM node:20-slim

# Set working directory inside the container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=8192"  npm run build

# Port used by public
#EXPOSE 5113
