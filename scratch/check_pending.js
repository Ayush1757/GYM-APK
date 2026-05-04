const mongoose = require('mongoose');
require('dotenv').config();

const PendingUserSchema = new mongoose.Schema({
    email: String,
    otp: String
});

const PendingUser = mongoose.model('PendingUser', PendingUserSchema);

async function checkPending() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const pending = await PendingUser.find({});
        console.log('Pending users:', pending);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPending();
