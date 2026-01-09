import express from "express";
import { createOrder, captureOrder } from "../controller/paymentController.js";

const router = express.Router();

router.post("/create-order",  createOrder);
router.post("/capture/:orderID",  captureOrder);

export default router;
