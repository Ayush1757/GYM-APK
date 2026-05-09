const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    email: String,
    memberName: String,
    amount: Number,
    date: { type: String, default: () => new Date().toISOString().split("T")[0] },
    method: String,
    plan: String,
    invoiceNo: String,
    status: { type: String, default: "Paid" }
});

// Avoid OverwriteModelError if already compiled
const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

module.exports = Payment;
