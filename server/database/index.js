const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const databaseCollection = async () => {
    try {
        await mongoose.connect(process.env.DBUrl);
        console.log("Database connected successfully!");
    } catch (error) {
        throw new Error(
            "Something went wrong, while connecting to the DATABASE!",
            error
        );
    }
};

module.exports = databaseCollection;
