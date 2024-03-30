var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var indexRouter = require("./routes/index");
var adminRouter = require("./routes/admin");
var authRouter = require("./routes/auth");

var app = express();

//import "express-session" library
var session = require("express-session");
//set session timeout
const timeout = 10000 * 60 * 60 * 24; // 24 hours (in milliseconds)
//config session parameters
app.use(
  session({
    secret: "practice_makes_perfect", // Secret key for signing the session ID cookie
    resave: false, // Forces a session that is "uninitialized" to be saved to the store
    saveUninitialized: true, // Forces the session to be saved back to the session store
    cookie: { maxAge: timeout },
  })
);

//db
var mongoose = require("mongoose");
var uri =
  "mongodb+srv://buiduccanh10:buiduccanh10@cluster0.rqr9q8a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/";
mongoose
  .connect(uri)
  .then(() => console.log("Connect db success"))
  .catch((error) => console.log(error));

app.listen(process.env.PORT || 3001);

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//make session value can be accessible in view (hbs)
//IMPORTANT: place this code before setting router url
app.use((req, res, next) => {
  res.locals.email = req.session.email;
  next();
});

//set user authorization for whole router
//IMPORTANT: place this code before setting router url
const { checkSingleSession } = require("./middlewares/auth");
app.use("/admin", checkSingleSession);

app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
