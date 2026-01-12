FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Build step for safety
RUN npm run build || true
EXPOSE 8080
CMD ["npm", "start"]
