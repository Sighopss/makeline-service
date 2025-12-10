const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/petstore';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Makeline Service: Connected to MongoDB'))
.catch(err => console.error('Makeline Service: MongoDB connection error:', err));

// Order Schema
const orderSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Product Service URL
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';

// Process pending orders
async function processPendingOrders() {
  try {
    // Find all pending orders
    const pendingOrders = await Order.find({ status: 'pending' }).limit(10);
    
    if (pendingOrders.length === 0) {
      console.log('Makeline Service: No pending orders to process');
      return;
    }

    console.log(`Makeline Service: Processing ${pendingOrders.length} pending orders`);

    for (const order of pendingOrders) {
      try {
        // Update order status to processing
        order.status = 'processing';
        order.updatedAt = new Date();
        await order.save();

        console.log(`Makeline Service: Processing order ${order._id}`);

        // Check product availability
        try {
          const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${order.productId}`);
          const product = productResponse.data;

          if (product.stock >= order.quantity) {
            // Update product stock
            await axios.put(`${PRODUCT_SERVICE_URL}/api/products/${order.productId}`, {
              stock: product.stock - order.quantity
            });

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mark order as completed
            order.status = 'completed';
            order.updatedAt = new Date();
            await order.save();

            console.log(`Makeline Service: Order ${order._id} completed successfully`);
          } else {
            // Insufficient stock
            order.status = 'cancelled';
            order.updatedAt = new Date();
            await order.save();
            console.log(`Makeline Service: Order ${order._id} cancelled - insufficient stock`);
          }
        } catch (productError) {
          console.error(`Makeline Service: Error checking product for order ${order._id}:`, productError.message);
          // Keep order in processing state, will retry on next cycle
        }
      } catch (orderError) {
        console.error(`Makeline Service: Error processing order ${order._id}:`, orderError.message);
      }
    }
  } catch (error) {
    console.error('Makeline Service: Error in processPendingOrders:', error.message);
  }
}

// Health check function
function healthCheck() {
  console.log('Makeline Service: Health check - Running');
  return {
    status: 'healthy',
    service: 'makeline-service',
    timestamp: new Date().toISOString()
  };
}

// Start processing orders every 10 seconds
setInterval(processPendingOrders, 10000);

// Process immediately on startup
processPendingOrders();

console.log('Makeline Service: Started and will process orders every 10 seconds');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Makeline Service: SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

