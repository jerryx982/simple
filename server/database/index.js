const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const databaseCollection = async () => {
    try {
        await mongoose.connect(process.env.DBUrl);
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("MongoDB Connection Error (Non-fatal):", error.message);
        // Do not throw, allows server to continue with local DB
    }

    mongoose.connection.on('error', err => {
        console.error("MongoDB Runtime Error:", err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.log("MongoDB Disconnected. Attempting reconnect...");
        // Auto-reconnect logic if desired, or just let it be
    });
};

module.exports = databaseCollection;
