const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    currencies: {
        BTC: { type: Number, default: 0 },
        ETH: { type: Number, default: 0 },
        USDT: { type: Number, default: 0 }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Balance', balanceSchema);
