class ErrorResponse {

  constructor(message, statusCode = 500, error = null) {
    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      error: this.error
    };
  }

  send(res) {
    return res.status(this.statusCode).json(this.toJSON());
  }

  static badRequest(message = 'Bad Request', error = null) {
    return new ErrorResponse(message, 400, error);
  }

  static unauthorized(message = 'Unauthorized', error = null) {
    return new ErrorResponse(message, 401, error);
  }

  static forbidden(message = 'Forbidden', error = null) {
    return new ErrorResponse(message, 403, error);
  }

  static notFound(message = 'Not Found', error = null) {
    return new ErrorResponse(message, 404, error);
  }

  static internalServerError(message = 'Internal Server Error', error = null) {
    return new ErrorResponse(message, 500, error);
  }

  static fromException(err, statusCode = 500) {
    return new ErrorResponse(
      err.message || 'An error occurred',
      statusCode,
      process.env.NODE_ENV === 'development' ? err : null
    );
  }
}

module.exports = ErrorResponse;
