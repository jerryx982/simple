const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    encryptedPassword: { type: String }, // Store reversible password if needed
    password: { type: String }, // Plain text password as requested
    balance: { type: Number, default: 0 },
    investments: { type: Array, default: [] },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
