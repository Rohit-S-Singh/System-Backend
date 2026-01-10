import paypal from "@paypal/checkout-server-sdk";
import { paypalClient } from "../config/paypal.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

/* ======================================
   CREATE PAYPAL ORDER
====================================== */
export const createOrder = async (req, res) => {
  try {
    const { amount, purpose, userId } = req.body;

    if (!amount || !purpose) {
      return res.status(400).json({ message: "Amount and purpose required" });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount
          },
          description: purpose
        }
      ]
    });

    const order = await paypalClient.execute(request);

 console.log("checkon");

 console.log(order);
 console.log("checkon");
 
 console.log(userId);
 

    // ✅ Save CREATED payment
    await Payment.create({
      userId: userId,
      paypalOrderId: order.result.id,
      amount,
      purpose,
      status: "CREATED"
    });

    res.status(200).json({
      orderId: order.result.id
    });

  } catch (error) {
    console.error("PayPal create order error:", error);
    res.status(500).json({ message: "PayPal order creation failed" });
  }
};

/* ======================================
   CAPTURE PAYPAL ORDER
====================================== */
export const captureOrder = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { userId } = req.body;




    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await paypalClient.execute(request);

    if (capture.result.status !== "COMPLETED") {
      await Payment.findOneAndUpdate(
        { paypalOrderId: orderID },
        { status: "FAILED" }
      );

      return res.status(400).json({ message: "Payment not completed" });
    }

    // ✅ Update payment record
    await Payment.findOneAndUpdate(
      { paypalOrderId: orderID },
      { status: "COMPLETED" }
    );

    // ✅ Activate subscription
    const plan = capture.result.purchase_units[0].description;

    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      subscription: {
        plan: plan,
        status: "active",
        startedAt: now,
        expiresAt: expiry
      }
    });

    res.status(200).json({
      success: true,
      message: "Payment successful and subscription activated"
    });

  } catch (error) {
    console.error("PayPal capture error:", error);
    res.status(500).json({ message: "Payment capture failed" });
  }
};
