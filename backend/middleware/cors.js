const cors = require('cors');

/**
 * CORS configuration for CEP extension
 * CEP extensions run from file:// protocol, so we need to handle that
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from file:// protocol (CEP extensions)
    // Also allow localhost for development
    const allowedOrigins = [
      /^file:\/\//,
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/
    ];
    
    // If no origin (like from file://), allow it
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(pattern => 
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);