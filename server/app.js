var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


require('dotenv').config()


// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGODB_HOST+process.env.MONGODB_COLLECTION)
// .then(()=>console.log("CONNECTED"))
// Routes Imports
var indexRouter = require('./routes/index');
// End of Routes Imports


var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
var apiV1 = require('./routes/api/v1');

for (let key in apiV1) {
  app.use("/api/v1",apiV1[key]);
}

// 

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
  res.render('error');
});

// Opening GSM
const {
  openConnection,
  onOpen,
  onMemoryFull,
  onNewMessage, 
  onError 
} = require("./controllers/GSMController");

openConnection();
onOpen();
onError();
onMemoryFull();
onNewMessage();
// End of GSM

module.exports = app;
