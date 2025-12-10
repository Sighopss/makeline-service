# Makeline-Service

Background worker service for automated order processing and fulfillment.

## Technology Stack

- Node.js
- MongoDB with Mongoose
- Axios for HTTP requests

## Functionality

- Polls for pending orders every 10 seconds
- Checks product availability via Product-Service
- Updates product stock when orders are processed
- Updates order status (pending → processing → completed)
- Handles insufficient stock scenarios

## Local Development

```bash
npm install
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/petstore)
- `PRODUCT_SERVICE_URL`: Product service URL (default: http://localhost:3001)
- `ORDER_SERVICE_URL`: Order service URL (default: http://localhost:3002)
- `NODE_ENV`: Environment (development/production)

## Docker Build

```bash
docker build -t makeline-service:latest .
docker run makeline-service:latest
```

## How It Works

1. Service starts and connects to MongoDB
2. Every 10 seconds, it queries for pending orders
3. For each pending order:
   - Updates status to "processing"
   - Checks product availability via Product-Service
   - If stock is sufficient:
     - Updates product stock
     - Updates order status to "completed"
   - If stock is insufficient:
     - Updates order status to "cancelled"
4. Logs all operations for monitoring

## Monitoring

Check logs to monitor order processing:

```bash
kubectl logs -f <makeline-service-pod> -n pet-store
```

Or with Docker:

```bash
docker logs -f <container-name>
```

