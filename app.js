const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();
require('express-async-errors');

const authMiddleware = require('./middleware/authentication');
const { bill, handleCheckoutSession, handlePaymentFailure } = require('./services/StripeService');

// Extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Error handlers
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// Routers
const authRouter = require('./routes/authRoute');
const addressRouter = require('./routes/addressRoute');
const serviceRouter = require('./routes/serviceRoute');
const mandateRouter = require('./routes/mandateRoute');
const orderRouter = require('./routes/orderRoute');
const productRouter = require('./routes/productRoute');

// DB connection
const connectDB = require('./db/connect');

app.set('trust proxy', 1);
app.use(rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 100
}));
app.use(helmet());
app.use(cors());
app.use(xss());

// Raw body parser for Stripe webhook
app.post('/api/v1/webhook', bodyParser.raw({ type: 'application/json' }), bill);

app.use(express.json()); // JSON parsing for other routes

// Other routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/address', authMiddleware, addressRouter);
app.use('/api/v1/services', authMiddleware, serviceRouter);
app.use('/api/v1/mandate', authMiddleware, mandateRouter);
app.use('/api/v1/order', authMiddleware, orderRouter);
app.use('/api/v1/products', productRouter);

app.use(notFoundMiddleware);
// app.use(errorHandlerMiddleware); // Ensure error handler is not affecting the webhook

// Start the server
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server listening on port ${port}...`);
    });
  } catch (error) {
    console.error(error);
  }
};
 
start();