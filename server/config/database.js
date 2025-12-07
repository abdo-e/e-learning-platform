const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️  MongoDB disconnected. Attempting to reconnect...");
            setTimeout(connectDB, 5000); // Retry after 5 seconds
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed through app termination");
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error("❌ Connection to MongoDB failed:", error.message);
        console.log("⚠️  Server will continue running without database connection.");
        console.log("⚠️  Retrying connection in 10 seconds...");

        // Retry connection after 10 seconds instead of exiting
        setTimeout(connectDB, 10000);
        return null;
    }
};

module.exports = { connectDB };
