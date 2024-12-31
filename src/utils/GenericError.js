import fs from "fs";
import path from "path";

// Create a writable stream (in append mode)
const logStream = fs.createWriteStream(
  path.join(path.resolve(), "access.log"),
  { flags: "a" }
);

class GenericError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong. Please try again later.",
    errors = [],
    errorStack = ""
  ) {
    super();
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (errorStack) {
      this.stack = errorStack;
    } else {
      Error.captureStackTrace(this, this.constructor);
      // Log the error to the log file
      this.logError();
    }
  }
  // Method to log the error
  logError() {
    const logMessage =
      `[${new Date().toISOString()}] ERROR: ${this.message}\n` +
      `Status Code: ${this.statusCode}\n` +
      `Errors: ${JSON.stringify(this.errors)}\n` +
      `Stack Trace:\n${this.stack}\n\n`;

    logStream.write(logMessage);
  }
}

export { GenericError };
