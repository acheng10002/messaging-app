// custom error class that extends the built-in `Error` class
class ApiError extends Error {
  // constructor gets called automatically when a new instance of ApiError is created
  constructor(statusCode, message) {
    /* calls the parent `Error`, sets the .message property, and initializes the 
      error stack trace */
    super(message);
    this.statusCode = statusCode;

    /* maintains proper stack trace for Node.js (for all V8 engines) from this point,
      omitting internal constructor calls 
      V8 engine - JS open-source engine devloped by Google, it's written in C++ and 
      compiles CSS directly to machine code */
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
