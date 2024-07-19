//import packages
require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const authMiddleware = require('./middleware/authentication');

//extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');


//error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');


app.set('trust proxy', 1);
app.use(rateLimit({
  windowMs: 10*60*1000,//10 min
  max: 100
}));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

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
// app.use(errorHandlerMiddleware);
 
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