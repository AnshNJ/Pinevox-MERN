const axios = require('axios');
const Order = require('../models/Order')
const stripe = require("stripe")(process.env.STRIPE_KEY);

const stripeService = async (orderDetails) => {
  const lineItems = orderDetails.map((item) => ({
    price_data: {
      currency: "GBP",
      product_data: {
        name: item.item,
      },
      unit_amount: Math.round(item.retailPrice * 100), // Stripe expects amount in cents
    },
    quantity: item.qty,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.YOUR_DOMAIN}/cancel`,
  });

  return session;
};

const bill = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Error verifying webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSession(event.data.object, "paid");
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutSession(event.data.object, "cancelled");
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    console.log("Order processed successfully");
    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).send("Error handling webhook");
  }
};

//Handle 
const handleCheckoutSession = async (session, status) => {
  const clientReferenceId = session.client_reference_id;
  console.log("Client Reference ID:", clientReferenceId);

  if (clientReferenceId) {
    try {
      const order = await Order.findById(clientReferenceId);

      if (order && order.paymentStatus === "pending") {
        order.paymentStatus = status;
        await order.save();
        console.log("Order status updated to:", status);
        // Uncomment the following line if you implement placeOrder functionality
        // await placeOrder(order);
      } else {
        console.log("Order not found or already processed:", clientReferenceId);
      }
    } catch (err) {
      console.error("Error updating order:", err);
    }
  } else {
    console.log("Client Reference ID not found in the session");
  }
};

//Handle payment failure
const handlePaymentFailure = async (paymentIntent) => {
  const clientReferenceId = paymentIntent.metadata.order_id;
  console.log("Client Reference ID:", clientReferenceId);

  if (clientReferenceId) {
    try {
      const order = await Order.findById(clientReferenceId);

      if (order && order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
        console.log("Order status updated to: failed");
      } else {
        console.log("Order not found or already processed:", clientReferenceId);
      }
    } catch (err) {
      console.error("Error updating order:", err);
    }
  } else {
    console.log("Payment Intent ID not found in the session");
  }
};

//place order with Provu
const placeOrder = async (order) => {
  const apiUrl = 'https://secure.provu.co.uk/prosys/xml.php';
  const xmlPayload = generateOrderXml(order);

  try {
    const response = await axios.post(apiUrl, xmlPayload, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    if (response.status === 200) {
      console.log('Order placed successfully with third-party API');
      return response.data;
    } else {
      console.log('Failed to place order with third-party API. Status code:', response.status);
      throw new Error('Failed to place order');
    }
  } catch (error) {
    console.error('Error placing order with third-party API:', error);
    throw error;
  }
}

module.exports = stripeService;
