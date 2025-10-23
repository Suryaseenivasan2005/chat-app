import mongoose from "mongoose";

// Function to connect with mongo db
export const connectDB = async() => {
    try {
        // Add connection options to handle timeout
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
            heartbeatFrequencyMS: 1000, // Check connection status more frequently
        };

        mongoose.connection.on('connected', () => console.log("Database Connected"));
        mongoose.connection.on('error', (err) => console.log("MongoDB Error:", err));
        
        // Use MongoDB Atlas URI from environment variable
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error("MONGODB_URI environment variable is not defined");
        }
        
        // Connect to MongoDB
        await mongoose.connect(mongoURI, options);
        
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.log("MongoDB Connection Error:", error);
        throw error; // Rethrow the error to be handled by the server
    }
}