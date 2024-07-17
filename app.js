//import packages
require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const authMiddleware = require('./middleware/authentication');

//error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

//router
const authRouter = require('./routes/authRoute');
const addressRouter = require('./routes/addressRoute');
const serviceRouter = require('./routes/serviceRoute');
const mandateRouter = require('./routes/mandateRoute');
const orderRouter = require('./routes/orderRoute')
const productRouter = require('./routes/productRoute')

//DB connection
const connectDB = require('./db/connect');

//middleware
app.use(express.json());

//routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/address",authMiddleware, addressRouter);
app.use("/api/v1/services",authMiddleware, serviceRouter);
app.use("/api/v1/mandate",authMiddleware, mandateRouter);
app.use("/api/v1/order",authMiddleware, orderRouter);
app.use("/api/v1/products", productRouter);


app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

//server actions
const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server listening to port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
