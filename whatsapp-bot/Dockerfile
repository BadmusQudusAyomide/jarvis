FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm install instead of npm ci
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create directory for auth data
RUN mkdir -p auth_info_baileys

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the bot
CMD ["npm", "start"]
