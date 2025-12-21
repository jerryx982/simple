const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    coin: { type: String, required: true }, // e.g., 'USDT', 'BTC'
    network: { type: String, required: true }, // e.g., 'TRC20', 'ERC20'
    address: { type: String, required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    netAmount: { type: Number, required: true }, // amount - fee
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    txHash: { type: String }, // For completed withdrawals (simulated)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
