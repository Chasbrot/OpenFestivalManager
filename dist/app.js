"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const rand_token_1 = require("rand-token");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const process_1 = require("process");
const fs = require('fs');
const compression = require('compression');
// Read command line arguments
var argv = require('minimist')(process.argv.slice(2));
if (!argv.env) {
    console.log("Using default env");
    let ret = dotenv_1.default.config({ path: __dirname + '/../.env' });
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
// view engine setup (express js)
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Parse incoming cookies
app.use((0, cookie_parser_1.default)());
// Cache Control Header function
let setCache = function (req, res, next) {
    // Cache for 24h
    const period = 60 * 60 * 24;
    // Only cache images, js and css files
    if (req.method == 'GET' && (req.url.includes("stylesheets") || req.url.includes("images") || req.url.includes("js") || req.url.includes("bs5") || req.url.includes("media"))) {
        res.set('Cache-control', `max-age=${period}`);
    }
    else {
        // for the other requests set strict no caching parameters
        res.set('Cache-control', `no-store`);
    }
    // remember to call next() to pass on the request
    next();
};
// Apply cache control header
app.use(setCache);
// Use public directory as root for web files
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Session valid for 24h
const oneDay = 1000 * 60 * 60 * 24;
// Set session parameters
app.use((0, express_session_1.default)({
    secret: (0, rand_token_1.uid)(32),
    saveUninitialized: true,
    cookie: {
        maxAge: oneDay,
        secure: (process.env.DEVELOPMENT != "true")
    },
    resave: false
}));
// Request Pre Routing
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const personalRouter = require('./routes/personal');
const tableRouter = require('./routes/table');
const stationRouter = require('./routes/station');
const restRouter = require('./routes/rest');
// Send requests for these paths to respective routing files
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/personal', personalRouter);
app.use('/table', tableRouter);
app.use('/station', stationRouter);
app.use('/rest', restRouter);
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
// Start express server
app.listen(port, () => {
    console.log(`[server]: Server is running at https://localhost:${port}`);
    console.log("[server]: Version " + process.env.VERSION);
});
