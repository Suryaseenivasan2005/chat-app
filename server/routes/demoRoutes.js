import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { initDemo, startDemo, resetDemo, getSession } from "../controller/demoController.js";

const demoRouter = express.Router();

// Public — no auth required (session doesn't exist yet)
demoRouter.post("/init", initDemo);
demoRouter.post("/start", startDemo);

// Protected — requires an active demo session token
demoRouter.post("/reset", protectRoute, resetDemo);
demoRouter.get("/session", protectRoute, getSession);

export default demoRouter;
