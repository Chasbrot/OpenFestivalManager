var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var randomToken = require('random-token');
const sessions = require('express-session');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var personalRouter = require('./routes/personal');
var tableRouter = require('./routes/table');
var stationRouter = require('./routes/station');
var dataRouter = require('./routes/data');

var app = express();

// Session state?
var session;

console.log("Starting Express Server ...");

// view engine setup (express js)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Parse incoming cookies
app.use(cookieParser());

// Cache Control Header function
let setCache = function (req, res, next) {
  // Cache for 24h
  const period = 60 * 60 * 24 

  // Only cache images, js and css files
  if (req.method == 'GET' && (req.url.includes("stylesheets") || req.url.includes("images") || req.url.includes("javascripts"))) {
    res.set('Cache-control', `max-age=${period}`)
  } else if (req.method == "GET" && (req.url.includes("productlist"))) {
    res.set('Cache-control', `max-age=300`)
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-control', `no-store`)
  }

  // remember to call next() to pass on the request
  next()
}
// Apply cache control header
app.use(setCache);

// Use public directory as root for web files
app.use(express.static(path.join(__dirname, 'public')));

// Session valid for 24h
const oneDay = 1000 * 60 * 60 * 24;
// Set session parameters
app.use(sessions({
    secret: randomToken(32), // Unique session token random generated
    saveUninitialized:true,   
    cookie: { maxAge: oneDay },
    resave: false 
}));

// Send requests for these paths to respective routing files
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/personal', personalRouter);
app.use('/table', tableRouter);
app.use('/station', stationRouter);
app.use('/data', dataRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { error: err});
});


app.listen(80, function () {
  console.log('Listening on port 80')
})


// Start local authorative dns server
// Resolves fom.lan -> localip
console.log("Starting DNS Server ...");

const dns2 = require('dns2');
var ip = require('ip');

const { Packet } = dns2;

const server = dns2.createServer({
  udp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;
    if (name == "festl.net") {
      response.answers.push({
        name,
        type: Packet.TYPE.A,
        class: Packet.CLASS.IN,
        ttl: 300,
        address: ip.address(),
      });
    }
    send(response);
  }
});


server.on('request', (request, response, rinfo) => {
  console.log("DNS Request: "+request.header.id, request.questions[0]);
});

server.on('requestError', (error) => {
  console.log('Client sent an invalid request', error);
});

console.log("DNS Server IP: " + ip.address());

server.listen({
  // Optionally specify port, address and/or the family of socket() for udp server:
  udp: { 
    port: 53,
    address: ip.address(),
    type: "udp4",  // IPv4 or IPv6 (Must be either "udp4" or "udp6")
  },
  
  // Optionally specify port and/or address for tcp server:
  tcp: { 
    port: 53,
    address: ip.address(),
  },
});



module.exports = app;
