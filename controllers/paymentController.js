const mongoose = require("mongoose");
const Payment = require("../models/paymentModel");
const { sendMembershipPaymentEmail } = require("../services/emailService");

const collectPayment = async (req, res) => {
    try {
        const { memberEmail, amount, method, plan } = req.body;
        
        // Dynamically get models since they are registered in server.js
        const User = mongoose.model("User");
        const AdminConfig = mongoose.model("AdminConfig");

        const member = await User.findOne({ email: memberEmail });
        if (!member) return res.status(404).json({ success: false, message: "Member not found" });

        const invoiceNo = "INV-" + Date.now();
        const payment = new Payment({
            email: memberEmail,
            memberName: member.fullname,
            amount: Number(amount),
            method,
            plan,
            invoiceNo
        });
        await payment.save();

        member.feesStatus = "Paid";
        member.lastPaymentDate = new Date().toISOString().split("T")[0];
        member.totalPaid = (member.totalPaid || 0) + Number(amount);

        if (plan) {
            member.membershipPlan = plan;
            let durationMonths = 1;
            if (plan.includes("quarterly")) durationMonths = 3;
            if (plan.includes("yearly")) durationMonths = 12;

            let d = new Date();
            if (member.expiry && member.expiry !== '--') {
                const currentExpiry = new Date(member.expiry);
                if (currentExpiry > d) d = currentExpiry;
            }
            d.setMonth(d.getMonth() + durationMonths);
            member.expiry = d.toISOString().split("T")[0];
        }

        await member.save();

        // Send Automated Payment Email asynchronously
        try {
            let durationStr = "1 Month";
            if (plan) {
                if (plan.includes("quarterly")) durationStr = "3 Months";
                else if (plan.includes("yearly")) durationStr = "1 Year";
            }
            
            // Fetch owner phone from AdminConfig, or fallback
            const adminConfig = await AdminConfig.findOne();
            const gymPhone = adminConfig && adminConfig.adminPhone ? adminConfig.adminPhone : "+91-XXXXXXXXXX";

            const emailData = {
                memberEmail: member.email,
                memberName: member.fullname,
                membershipPlan: plan ? plan.replace(/_/g, ' ') : 'N/A',
                duration: durationStr,
                startDate: member.lastPaymentDate,
                expiryDate: member.expiry || 'N/A',
                amount: amount,
                paymentMethod: method,
                ownerPhone: gymPhone
            };

            // Call the service without awaiting to keep it async/non-blocking
            sendMembershipPaymentEmail(emailData).catch(err => console.error("Async email error", err));
            
        } catch (mailError) {
            console.log('Error triggering mail sequence', mailError);
        }

        res.json({ success: true, message: "Payment recorded successfully", invoiceNo });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ _id: -1 }).lean();
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPaymentsByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        const payments = await Payment.find({ email }).sort({ _id: -1 }).lean();
        res.json({ success: true, payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    collectPayment,
    getPayments,
    getPaymentsByEmail
};
