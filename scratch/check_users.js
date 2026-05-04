const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    role: String
});

const User = mongoose.model('User', UserSchema);

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'fullname email role');
        console.log('Users found:', users);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
