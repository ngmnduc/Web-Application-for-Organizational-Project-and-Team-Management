/**
 * Global Error Handler Middleware
 * Standardizes all error responses to match API spec format:
 * { success: false, error: "ErrorType", message: "..." }
 */
export const errorHandler = (err, req, res, next) => {
  // Default status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorType = "ServerError";
  let message = err.message || "Internal server error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorType = "ValidationError";
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    errorType = "ConflictError";
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    errorType = "ValidationError";
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorType = "AuthenticationError";
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorType = "AuthenticationError";
    message = "Token expired";
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: errorType,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
