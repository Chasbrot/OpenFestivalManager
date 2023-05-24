import { AccountType } from './entity/Account';
import express, { Express, Request, Response } from 'express';
import { AppDataSource, ds } from './data-source';
import dotenv from 'dotenv';
import path from 'path';
import sessions from 'express-session';
import { uid, suid } from 'rand-token';
import cookieParser from 'cookie-parser';
import { Account } from 'entity/Account';
import { Station } from 'entity/Station';
import { exit } from 'process';
const fs = require('fs');
const compression = require('compression')
var os = require("os");


// Read command line arguments
var argv = require('minimist')(process.argv.slice(2));
if (!argv.env) {
  console.log("Using default env")
  let ret = dotenv.config({path:__dirname+'/../.env'})
  if (ret.error) {
    console.log("Config parsing failed")
    process.exit(1)
  }
} else {
  // Load data from .env config file
  let ret = dotenv.config({path: argv.env})
  if (ret.error) {
    console.log("Config parsing failed")
    process.exit(1)
  }
}


// Add account data to session
declare module 'express-session' {
  interface SessionData {
    account: Account,
    station?: Station
  }
}



// Create express app
const app: Express = express();
// Set port
const port = process.env.PORT;

// Development enviroment variable
if (process.env.DEVELOPMENT == "true") {
  console.log("Starting Server in Development Mode!!");
}

// Enable Compression
app.use(compression())

// view engine setup (express js)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse incoming cookies
app.use(cookieParser());

// Cache Control Header function
let setCache = function (req: Request, res: Response, next:any) {
  // Cache for 24h
  const period = 60 * 60 * 24 

  // Only cache images, js and css files
  if (req.method == 'GET' && (req.url.includes("stylesheets")|| req.url.includes("webui") || req.url.includes("gicons")|| req.url.includes("images") || req.url.includes("js") || req.url.includes("bs5") || req.url.includes("media"))) {
    res.set('Cache-control', `max-age=${period}`)
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-control', `no-store`)
  }

  // remember to call next() to pass on the request
  next()
}
// Apply cache control header only if production
if (process.env.DEVELOPMENT!="true") {
  app.use(setCache);
}


// Use public directory as root for web files
app.use(express.static(path.join(__dirname, 'public')));

// Session valid for 24h
const oneDay = 1000 * 60 * 60 * 24;
// Set session parameters
app.use(sessions({
    secret: uid(32), // Unique session token random generated
    saveUninitialized:true,   
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
const webuiRouter = require('./routes/webui');

// Send requests for these paths to respective routing files
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/personal', personalRouter);
app.use('/table', tableRouter);
app.use('/station', stationRouter);
app.use('/rest', restRouter);
app.use('/webui', webuiRouter);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ORM Mapper
// to initialize initial connection with the database, register all entities
// and "synchronize" database schema, call "initialize()" method of a newly created database
// once in your application bootstrap

// Create DataSource from file
if (!ds.createADSFromFile()) {
  exit();
}

// Start express server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port} or http://${os.hostname()}:3000`);
  console.log("[server]: Version " + process.env.VERSION);
});

