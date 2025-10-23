import mongoose from "mongoose";

// Function to connect with mongo db
export const connectDB = async() => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 60000,      // Increased timeout to 60 seconds
            socketTimeoutMS: 45000,               // How long to wait for responses from MongoDB
            heartbeatFrequencyMS: 2000,           // More frequent heartbeats
            maxPoolSize: 100,                     // Maximum number of connections
            minPoolSize: 5,                       // Minimum number of connections
            retryWrites: true,
            w: "majority"                         // Write concern
        };

        // Set up connection event handlers
        mongoose.connection.on('connected', () => console.log("MongoDB Connected"));
        mongoose.connection.on('error', (err) => console.log("MongoDB Error:", err));
        mongoose.connection.on('disconnected', () => console.log("MongoDB Disconnected"));
        mongoose.connection.on('reconnected', () => console.log("MongoDB Reconnected"));

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is not defined");
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log("Successfully connected to MongoDB Atlas");

    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        // Wait 5 seconds before retrying
        console.log("Retrying connection in 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        throw error; // Rethrow the error to be handled by the server
    }
}