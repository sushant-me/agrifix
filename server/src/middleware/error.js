/** API error with HTTP status. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wrap async route handlers so rejections reach the error middleware. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Send an error response (used by throwing code paths). */
export function apiError(status, message) {
  throw new ApiError(status, message);
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error('[error]', req.method, req.originalUrl, err.message, err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
}