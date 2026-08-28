import jwt from "jsonwebtoken";

// Function to generate a token for a user.
// extraPayload is optional — used by demo sessions to embed demoSessionId / expiresAt.
export const generateToken = (userId, extraPayload = {}) => {
    const token = jwt.sign({ userId, ...extraPayload }, process.env.JWT_SECRET);
    return token;
};