import connectDB from "../DB/connect.js";
// Security imports
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";

// Routers
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import invoiceRouter from "./routes/invoice.routes.js";

// Utilities
import { GlobalErrorHandling } from "./utils/errorHandling.js";
import { hellowpage } from "./utils/templetHtml.js";

export const bootstrap = (app, express) => {
  // CORS Configuration
  const allowedOrigins = [
    "https://graduation-project-beryl-seven.vercel.app",
    "http://localhost:3000",
    "https://localhost:3000",
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
  app.use(cors(corsOptions));

  // Middleware for parsing JSON and URL-encoded data
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true }));

  // Security Middleware
  app.use(mongoSanitize());
  app.use(hpp());

  // Database Connection
  connectDB();

  // Logging Middleware
  if (process.env.MOOD === "DEV") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/invoice", invoiceRouter);

  // Welcome Page
  app.get("/", async (req, res) => {
    console.log({ IP: req.ip });
    console.log(
      "URL: " + req.protocol + "://" + req.hostname + req.originalUrl
    );
    const result = await hellowpage();
    res.status(200).send(result);
  });

  // Handle Undefined Routes
  app.all("*", (req, res) => {
    res.status(404).json({ message: "Invalid route or method!" });
  });

  // Global Error Handling
  app.use(GlobalErrorHandling);
};
