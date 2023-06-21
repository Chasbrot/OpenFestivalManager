// Copyright Michael Selinger 2023
// Imports
// -- Data Model and Application Data
import { Account } from "entity/Account";
import { Station } from "entity/Station";
import { AccountType } from "./entity/Account";
// -- ORM Mapper and Database
import { AppDataSource, ds } from "./data-source";
// -- Express Webserver
import express, { Express, Request, Response } from "express";
import sessions from "express-session";
import { uid, suid } from "rand-token";
import cookieParser from "cookie-parser";
const compression = require("compression");
// -- OS System
import { exit } from "process";
import dotenv from "dotenv";
import path from "path";
const fs = require("fs");
var os = require("os");
// -- Security Imports
import helmet from "helmet";
const https = require("https");

console.log("Welcome to OpenFestivalManager!");
console.log("Copyright Michael Selinger 2023");

// Read Command Line and setup configuration
let serverConfig = readCommandLineOptions();

if (!serverConfig) {
  printHelpText();
  process.exit(0);
}

// Development enviroment variable
if (serverConfig.DEV) {
  global.dev = true;
  console.log("Starting Server in Development Mode!!");
  console.log("Active server configuration:")
  console.log(serverConfig)
}else{
  global.dev = false;
}



// Add account data to session
declare module "express-session" {
  interface SessionData {
    account: Account;
    station?: Station;
  }
}

// Create express app
const app: Express = express();

// Development enviroment variable
if (serverConfig.DEV) {
  console.log("Starting Server in Development Mode!!");
}

// Enable Compression
app.use(compression());

// Use Helmet Security Headers
if (serverConfig.SECURE) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
}


// view engine setup (express js)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse incoming cookies
app.use(cookieParser());

// Cache Control Header function
let setCache = function (req: Request, res: Response, next: any) {
  // Cache for 24h
  const period = 60 * 60 * 24;

  // Only cache images, js and css files
  if (
    req.method == "GET" &&
    (req.url.includes("stylesheets") ||
      req.url.includes("webui") ||
      req.url.includes("gicons") ||
      req.url.includes("images") ||
      req.url.includes("js") ||
      req.url.includes("bs5") ||
      req.url.includes("media"))
  ) {
    res.set("Cache-control", `max-age=${period}`);
  } else {
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
app.use(express.static(path.join(__dirname, "public")));

// Session valid for 24h
const oneDay = 1000 * 60 * 60 * 24;
// Set session parameters
app.use(
  sessions({
    name: serverConfig.SECURE && serverConfig.HTTPS ? "__Host-sid" : "sid", // Only accept secure cookies with "secure flag" and https
    secret: uid(32), // Unique session token random generated
    saveUninitialized: true,
    cookie: {
      maxAge: oneDay,
      secure: serverConfig.HTTPS, // Only set secure flag during production with https
      sameSite: true,
    },
    resave: false,
  })
);

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
ds.createADSSQLite(serverConfig.DB_PATH).then((e)=>{
  if(!e){
    console.log("[server]: Failed to start database backend driver");
    process.exit(1)
  }
});
  


try {
  let port = serverConfig.PORT
  let version = serverConfig.VERSION
  // Check HTTPS
  if (
    serverConfig.HTTPS
  ) {
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
        },
        app
      )
      .listen(port, () => {
        console.log(
          `[server]: Secure Server is running at https://localhost:${port} or https://${os.hostname()}:${port} `
        );
        console.log("[server]: Version " + version);
      });
  } else {
    // Start express server with HTTP Only
    app.listen(port, () => {
      console.log(
        `[server]: Server is running at http://localhost:${port} or http://${os.hostname()}:${port} `
      );
      console.log("[server]: Version " + version);
    });
  }
} catch (err) {
  console.log(`[server]: Couldn't start server! ${err}`);
}


//// Functions


function printHelpText() {
  console.log("usage: festivalmanager [options] --dbpath PATH_TO_DB_FILE")
  console.log("  options:")
  console.log("    -p --port         Port the server listens to")
  console.log("    --rest_cache_time The time (in s) rest requests are cached by the client")
  console.log("    -s --secure       Enables security headers")
  console.log("    --key             Key required for HTTPS")
  console.log("    --cert            Certificate required for HTTPS")
  console.log("    --dbpath          Path to the database")
  console.log("    --nocache         Disables Caching")
  console.log("    ")
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
    VERSION: "2.0.7",
    NO_CACHE: false
  };
  // Read command line arguments
  let argv = require("minimist")(process.argv.slice(2));
  if (argv.h || argv.help) {
    return null
  }
  if (argv.env) {
    // Load data from .env config file
    let ret = dotenv.config({ path: argv.env.replace(/[?%*'|"<>]/g, '') });
    if (ret.error) {
      console.log("Config parsing failed");
      console.log(ret.error)
      return null
    }
    try {
      defaultConfig.PORT = Number(process.env.PORT);
      /// WHY JS?? Are we in kindergarden or what?
      defaultConfig.DEV = process.env.DEVELOPMENT=="true"?true:false;
      if(Number.isNaN(Number(process.env.REST_CACHE_TIME))){
        defaultConfig.REST_CACHE_TIME = Number(process.env.REST_CACHE_TIME);
      }
      defaultConfig.SECURE = process.env.SECURE=="true"?true:false;
      // Why do i need to do this? How thought this was a good idea? Fuck JS
      if (process.env.KEY) {
        defaultConfig.KEY = String(process.env.KEY);
      } else {
        defaultConfig.KEY = ""
      }
      if (process.env.CERT) {
        defaultConfig.CERT = String(process.env.CERT);
      } else {
        defaultConfig.CERT = ""
      }
      
      defaultConfig.DB_PATH = String(process.env.DB_PATH);
    } catch (err) {
      console.log("Invalid coniguration data");
      console.log(err)
      return null
    }
  } else {
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
          console.log("Key and Certificate needed for HTTPS")
          return null
        }
        defaultConfig.KEY = String(argv.key).replace(/[?%*'|"<>]/g, '');
        defaultConfig.CERT = String(argv.cert).replace(/[?%*'|"<>]/g, '');
        defaultConfig.HTTPS = true
      }
      if (argv.dbpath) {
        defaultConfig.DB_PATH = String(argv.dbpath).replace(/[?%*'|"<>]/g, '');
      } else {
        console.log("Path to Database required --dbpath")
        return null
      }
      if (argv.nocache) {
        defaultConfig.NO_CACHE = argv.nocache=="true"?true:false;
      }
    } catch (err) {
      console.log("Invalid coniguration data");
      console.log(err)
      return null
    }
    
  }
  return defaultConfig;
}