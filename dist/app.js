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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs = require("fs");
var os = require("os");
// -- Security Imports
const helmet_1 = __importDefault(require("helmet"));
const https = require("https");
// Read Command Line and setup configuration
let serverConfig = readCommandLineOptions();
if (!serverConfig) {
    printHelpText();
    process.exit(0);
}
if (serverConfig.DEV) {
    console.log("Active server configuration:");
    console.log(serverConfig);
}
// Create express app
const app = (0, express_1.default)();
// Development enviroment variable
if (serverConfig.DEV) {
    global.dev = true;
    console.log("Starting Server in Development Mode!!");
}
else {
    global.dev = false;
}
// Enable Compression
app.use(compression());
// Use Helmet Security Headers
if (serverConfig.SECURE) {
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
}
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
if (!serverConfig.DEV) {
    app.use(setCache);
}
// Use public directory as root for web files
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Session valid for 24h
const oneDay = 1000 * 60 * 60 * 24;
// Set session parameters
app.use((0, express_session_1.default)({
    name: serverConfig.SECURE && serverConfig.HTTPS ? "__Host-sid" : "sid",
    secret: (0, rand_token_1.uid)(32),
    saveUninitialized: true,
    cookie: {
        maxAge: oneDay,
        secure: serverConfig.HTTPS,
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
if (!data_source_1.ds.createADSSQLite(serverConfig.DB_PATH)) {
    console.log("[server]: Failed to start database backend driver");
    process.exit(1);
}
try {
    let port = serverConfig.PORT;
    let version = serverConfig.VERSION;
    // Check HTTPS
    if (serverConfig.HTTPS) {
        if (!fs.existsSync(serverConfig.KEY) || !fs.existsSync(serverConfig.CERT)) {
            console.log("[Server] SSL key and certificate not found!");
            process.exit(1);
        }
        // Start express server with HTTPS
        https
            .createServer(
        // Provide the private and public key to the server by reading each
        // file's content with the readFileSync() method.
        {
            key: fs.readFileSync(serverConfig.KEY),
            cert: fs.readFileSync(serverConfig.CERT),
        }, app)
            .listen(port, () => {
            console.log(`[server]: Secure Server is running at https://localhost:${port} or https://${os.hostname()}:${port} `);
            console.log("[server]: Version " + version);
        });
    }
    else {
        // Start express server with HTTP Only
        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port} or http://${os.hostname()}:${port} `);
            console.log("[server]: Version " + version);
        });
    }
}
catch (err) {
    console.log(`[server]: Couldn't start server! ${err}`);
}
//// Functions
function printHelpText() {
    console.log("useage: festivalmanager [options] --dbpath PATH_TO_DB_FILE");
    console.log("  options:");
    console.log("    -p --port         Port the server listens to");
    console.log("    --rest_cache_time The time (in s) rest requests are cached by the client");
    console.log("    -s --secure       Enables security headers");
    console.log("    --key             Key required for HTTPS");
    console.log("    --cert            Certificate required for HTTPS");
    console.log("    --dbpath          Path to the database");
    console.log("    ");
}
function readCommandLineOptions() {
    let defaultConfig = {
        PORT: 8080,
        DEV: false,
        REST_CACHE_TIME: 3600,
        SECURE: false,
        HTTPS: false,
        KEY: "",
        CERT: "",
        DB_PATH: "",
        VERSION: "2.0.0"
    };
    // Read command line arguments
    let argv = require("minimist")(process.argv.slice(2));
    if (argv.h || argv.help) {
        return null;
    }
    if (argv.env) {
        // Load data from .env config file
        let ret = dotenv_1.default.config({ path: argv.env.replace(/[?%*'|"<>]/g, '') });
        if (ret.error) {
            console.log("Config parsing failed");
            console.log(ret.error);
            return null;
        }
        try {
            defaultConfig.PORT = Number(process.env.PORT);
            defaultConfig.DEV = Boolean(process.env.DEVELOPMENT);
            defaultConfig.REST_CACHE_TIME = Number(process.env.REST_CACHE_TIME);
            defaultConfig.SECURE = Boolean(process.env.SECURE);
            // Why do i need to do this? How thought this was a good idea? Fuck JS
            if (process.env.KEY) {
                defaultConfig.KEY = String(process.env.KEY);
            }
            else {
                defaultConfig.KEY = "";
            }
            if (process.env.CERT) {
                defaultConfig.CERT = String(process.env.CERT);
            }
            else {
                defaultConfig.CERT = "";
            }
            defaultConfig.DB_PATH = String(process.env.DB_PATH);
        }
        catch (err) {
            console.log("Invalid coniguration data");
            console.log(err);
            return null;
        }
    }
    else {
        // Parse all cmd options
        try {
            if (argv.port || argv.p) {
                defaultConfig.PORT = Number(argv.port);
            }
            if (argv.dev) {
                defaultConfig.DEV = Boolean(argv.dev);
            }
            if (argv.rest_cache_time) {
                defaultConfig.REST_CACHE_TIME = Number(argv.rest_cache_time);
            }
            if (argv.secure || argv.s) {
                defaultConfig.SECURE = Boolean(argv.secure);
            }
            if (argv.key || argv.cert) {
                if (!(argv.key && argv.cert)) {
                    console.log("Key and Certificate needed for HTTPS");
                    return null;
                }
                defaultConfig.KEY = String(argv.key).replace(/[?%*'|"<>]/g, '');
                defaultConfig.CERT = String(argv.cert).replace(/[?%*'|"<>]/g, '');
                defaultConfig.HTTPS = true;
            }
            if (argv.dbpath) {
                defaultConfig.DB_PATH = String(argv.dbpath).replace(/[?%*'|"<>]/g, '');
            }
            else {
                console.log("Path to Database required --dbpath");
                return null;
            }
        }
        catch (err) {
            console.log("Invalid coniguration data");
            console.log(err);
            return null;
        }
    }
    return defaultConfig;
}
