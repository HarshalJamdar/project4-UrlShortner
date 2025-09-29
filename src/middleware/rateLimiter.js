// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

const createShortUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    status: false,
    message: "Too many requests, please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
});

module.exports = createShortUrlLimiter;