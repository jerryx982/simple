const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String, // Matching uuid from db.json
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['login', 'withdrawal', 'free_plan_activated', 'free_plan_completed'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
