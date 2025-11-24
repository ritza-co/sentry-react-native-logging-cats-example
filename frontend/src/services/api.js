import * as Sentry from '@sentry/react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to make API requests with Sentry error tracking
async function makeRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  const isPost = method === 'POST';

  try {
    // Log API request start using Sentry.logger
    Sentry.logger.debug("API request initiated", {
      method,
      endpoint,
      url: `${API_URL}${endpoint}`,
    });
    
    // Add breadcrumb BEFORE the request
    Sentry.addBreadcrumb({
      category: 'api-request',
      message: `${method} ${endpoint}`,
      level: 'debug',
      data: {
        endpoint,
        method,
      },
    });

    const startTime = Date.now();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    
    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      const error = new Error(`API Error: ${response.status}`);
      
      // Log API error with full context
      Sentry.logger.error("API request failed", {
        method,
        endpoint,
        statusCode: response.status,
        duration_ms: duration,
        errorMessage: errorData,
      });
      
      // Add breadcrumb on failure
      Sentry.addBreadcrumb({
        category: 'api-error',
        message: `${method} ${endpoint} failed with status ${response.status}`,
        level: 'error',
        data: {
          endpoint,
          method,
          statusCode: response.status,
          response: errorData,
        },
      });

      // Capture the API error with context
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          errorSource: 'api_call',
          endpoint,
          method,
        },
        contexts: {
          http: {
            status_code: response.status,
            method,
            url: `${API_URL}${endpoint}`,
          },
        },
      });

      throw error;
    }

    const data = await response.json();

    // Log successful API response with performance metrics
    Sentry.logger.trace("API request completed successfully", {
      method,
      endpoint,
      statusCode: response.status,
      duration_ms: duration,
    });

    // Add breadcrumb on success
    Sentry.addBreadcrumb({
      category: 'api-request',
      message: `${method} ${endpoint} succeeded`,
      level: 'debug',
      data: {
        endpoint,
        method,
        status: response.status,
      },
    });

    return data;
  } catch (error) {
    // Capture any network errors that aren't already captured
    if (!error.message.includes('API Error')) {
      // Log network errors (like timeout, no connection)
      Sentry.logger.error("Network error during API request", {
        method,
        endpoint,
        errorMessage: error.message,
        errorType: "network_error",
      });
      
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          errorSource: 'api_call',
          endpoint,
          method,
          errorType: 'network_error',
        },
      });
    }
    throw error;
  }
}

export const api = {
  async get(endpoint) {
    return makeRequest(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Export the user identification function for use in auth flows
export function setCurrentUser(userId, userEmail) {
  Sentry.setUser({
    id: userId,
    email: userEmail,
    username: userEmail.split('@')[0],
  });
}

export function clearCurrentUser() {
  Sentry.setUser(null);
}
