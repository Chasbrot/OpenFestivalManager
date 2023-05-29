"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// -- ORM Mapper and Database
const data_source_1 = require("./data-source");
// -- Express Webserver
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const rand_token_1 = require("rand-token");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression = require("compression");
// -- OS System 
const process_1 = require("process");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs = require("fs");
var os = require("os");
// Security Imports
const helmet_1 = __importDefault(require("helmet"));
const https = require("https");
// Read command line arguments
var argv = require("minimist")(process.argv.slice(2));
if (!argv.env) {
    console.log("Using default env");
    let ret = dotenv_1.default.config({ path: __dirname + "/../.env" });
    if (ret.error) {
        console.log("Config parsing failed");
        process.exit(1);
    }
}
else {
    // Load data from .env config file
    let ret = dotenv_1.default.config({ path: argv.env });
    if (ret.error) {
        console.log("Config parsing failed");
        process.exit(1);
    }
}
// Create express app
const app = (0, express_1.default)();
// Set port
const port = process.env.PORT;
// Development enviroment variable
if (process.env.DEVELOPMENT == "true") {
    console.log("Starting Server in Development Mode!!");
}
// Enable Compression
app.use(compression());
// Use Helmet Security Headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
// view engine setup (express js)
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Parse incoming cookies
app.use((0, cookie_parser_1.default)());
// Cache Control Header function
let setCache = function (req, res, next) {
    // Cache for 24h
    const period = 60 * 60 * 24;
    // Only cache images, js and css files
    if (req.method == "GET" &&
        (req.url.includes("stylesheets") ||
            req.url.includes("webui") ||
            req.url.includes("gicons") ||
            req.url.includes("images") ||
            req.url.includes("js") ||
            req.url.includes("bs5") ||
            req.url.includes("media"))) {
        res.set("Cache-control", `max-age=${period}`);
    }
    else {
        // for the other requests set strict no caching parameters
        res.set("Cache-control", `no-store`);
    }
    // remember to call next() to pass on the request
    next();
};
// Apply cache control header only if production
if (process.env.DEVELOPMENT != "true") {
    app.use(setCache);
}
// Use public directory as root for web files
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Session valid for 24h
const oneDay = 1000 * 60 * 60 * 24;
// Set session parameters
app.use((0, express_session_1.default)({
    name: process.env.HTTPS == "true" ? "__Host-sid" : "sid",
    secret: (0, rand_token_1.uid)(32),
    saveUninitialized: true,
    cookie: {
        maxAge: oneDay,
        secure: process.env.HTTPS == "true",
        sameSite: true,
    },
    resave: false,
}));
// Request Pre Routing
const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin");
const personalRouter = require("./routes/personal");
const tableRouter = require("./routes/table");
const stationRouter = require("./routes/station");
const restRouter = require("./routes/rest");
const webuiRouter = require("./routes/webui");
// Send requests for these paths to respective routing files
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/personal", personalRouter);
app.use("/table", tableRouter);
app.use("/station", stationRouter);
app.use("/rest", restRouter);
app.use("/webui", webuiRouter);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ORM Mapper
// to initialize initial connection with the database, register all entities
// and "synchronize" database schema, call "initialize()" method of a newly created database
// once in your application bootstrap
// Create DataSource from file
if (!data_source_1.ds.createADSFromFile()) {
    (0, process_1.exit)();
}
try {
    // Check HTTPS
    if (process.env.HTTPS == "true" &&
        fs.existsSync(__dirname + "../../key.pem") &&
        fs.existsSync(__dirname + "../../key.pem")) {
        // Start express server with HTTPS
        try {
            https
                .createServer(
            // Provide the private and public key to the server by reading each
            // file's content with the readFileSync() method.
            {
                key: fs.readFileSync(__dirname + "../../key.pem"),
                cert: fs.readFileSync(__dirname + "../../cert.pem"),
            }, app)
                .listen(port, () => {
                console.log(`[server]: Server is running at https://localhost:${port} or https://${os.hostname()}:${port} `);
                console.log("[server]: Version " + process.env.VERSION);
            });
        }
        catch (err) {
            console.log(`[server]: Couldn't start server! ${err}`);
        }
    }
    else {
        console.log("[Server] SSL key and certificate found!");
        // Start express server with HTTP Only
        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port} or http://${os.hostname()}:${port} `);
            console.log("[server]: Version " + process.env.VERSION);
        });
    }
}
catch (err) {
    console.log(`[server]: Error with certificate management ${err}`);
    (0, process_1.exit)();
}
