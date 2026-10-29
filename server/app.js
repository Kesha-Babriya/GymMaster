import * as dotenv from "dotenv";
dotenv.config();

// downloaded package require
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// Configure CORS for local development and deployed frontend (Vercel)
const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
];

const getCustomOrigins = () => {
    const raw = [process.env.CLIENT_URL, process.env.FRONTEND_URL].filter(Boolean);
    const list = [];
    raw.forEach((entry) => {
        entry.split(",").forEach((item) => {
            const clean = item.trim().replace(/\/+$/, "");
            if (clean && !list.includes(clean)) {
                list.push(clean);
            }
        });
    });
    return list;
};

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman, server-to-server, cloud health-checks)
        if (!origin) {
            return callback(null, true);
        }

        const allowed = [...defaultAllowedOrigins, ...getCustomOrigins()];
        const isExplicitlyAllowed = allowed.includes(origin);

        let isVercelDomain = false;
        try {
            isVercelDomain = /\.vercel\.app$/.test(new URL(origin).hostname);
        } catch (_) {}

        const isLocalDev = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");

        if (isExplicitlyAllowed || isVercelDomain || isLocalDev) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// user defined package
import connectDB from "./utils/connectDB.js";
import authRoute from "./routes/authRoute.js";
import planRoute from "./routes/planCategoryRoute.js";
import subscriptionRoute from "./routes/subscriptionRoute.js";
import ContactRoute from "./routes/contactRoute.js";
import feedBackRoute from "./routes/feedBackRoute.js";

app.get("/", (req, res) => {
    res.send("server is running successfully");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/plan", planRoute);
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/contact", ContactRoute);
app.use("/api/v1/feedback", feedBackRoute);

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ Error: MONGO_URI is missing or undefined in environment variables.");
            process.exit(1);
        }
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`server is running on port ${PORT}`);
        });        
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB. Server startup aborted.");
        const safeMessage = err.message ? err.message.replace(/mongodb(\+srv)?:\/\/[^\s@]+@[^\s/]+/gi, "mongodb+srv://[CREDENTIALS_REDACTED]") : "Unknown database error";
        console.error(`Error: ${err.name || "Error"} - ${safeMessage}`);
        process.exit(1);
    }
};

startServer();








