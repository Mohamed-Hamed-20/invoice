import express from "express";
import dotenv from "dotenv";
import { bootstrap } from "./src/index.routes.js";

dotenv.config({ path: "./config/config.env" });
dotenv.config();

const app = express();

//bootstrap
bootstrap(app, express);

const port = parseInt(process.env.PORT);

app.listen(port || 5000, () => console.log(`App listening on PORT ${port}!`));
