# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies for building
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source code and generate prisma client
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy built assets and prisma schema
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/docker-entrypoint.sh ./
COPY --from=build /app/scripts ./scripts

# Install additional tools needed for migration and production
RUN apk add --no-cache openssl bash
RUN chmod +x docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
