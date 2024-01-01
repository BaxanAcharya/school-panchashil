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
    }
  }
}

export { GenericError };
