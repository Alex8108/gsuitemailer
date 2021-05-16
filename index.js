require("dotenv").config();
const express = require("express");
const port = normalizePort(process.env.PORT || "3000"); 
const app = express();
const rootRouter = require("./routes/root");

app.set("view engine", "ejs");
app.set("views", "./views");

app.listen(port, () => {
  console.log(`App listening ${port} port.`);
});

app.use("/", rootRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    
    let err = new Error("Not Found");
    err.status = 404;
    next(err);

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

process.on("uncaughtException", function (err) {
  
  console.error((new Date).toUTCString() + " uncaughtException:", err.message);
  console.error(err.stack);
  process.exit(1);

})

/**
 * Normalize a port into a number, string, or false.
 */
 function normalizePort(val) {

    let port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;

} 