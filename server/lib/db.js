import mongoose from "mongoose";

// Function to connect with mongo db
export const connectDB = async() => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"));
        
        // Use a local MongoDB connection instead of Atlas
        const localMongoURI = "mongodb://localhost:27017/VettiPechu";
        
        // Connect to MongoDB
        await mongoose.connect(localMongoURI);
        
        console.log("Connected to local MongoDB");
    } catch (error) {
        console.log("MongoDB Connection Error:", error);
    }
}