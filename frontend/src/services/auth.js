import * as Sentry from '@sentry/react-native';
import { api, setCurrentUser } from './api';

/**
 * Login user and set Sentry user context
 * 
 * This demonstrates how to identify users in Sentry errors
 * so you can see which users are affected by issues.
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with authentication token
 */
export async function loginUser(email, password) {
  // Log authentication attempt using Sentry.logger
  Sentry.logger.info("User login attempt", {
    email,
    operation: "loginUser",
    timestamp: Date.now(),
  });
  
  try {
    // Add breadcrumb for login attempt
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `Login attempt for user ${email}`,
      level: 'info',
      data: {
        email,
      },
    });

    const response = await api.post('/api/auth/login', { 
      email, 
      password 
    });
    
    const { userId, token } = response;
    
    // Set user in Sentry so all future errors are associated with this user
    setCurrentUser(userId, email);
    
    // Log successful authentication
    Sentry.logger.info("User login successful", {
      userId,
      email,
      authMethod: "password",
    });
    
    // Add breadcrumb for successful login
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `Successfully logged in user ${email}`,
      level: 'info',
      data: {
        email,
        userId,
      },
    });
    
    return response;
  } catch (error) {
    // Log authentication failure
    Sentry.logger.error("User login failed", {
      email,
      errorMessage: error.message,
      errorCode: error.response?.status,
    });
    
    // Add breadcrumb for failed login
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `Login failed for user ${email}`,
      level: 'error',
      data: {
        email,
        errorMessage: error.message,
      },
    });

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        operation: 'loginUser',
        userEmail: email,
      },
      contexts: {
        auth: {
          email,
          operation: 'login',
        },
      },
    });
    
    throw error;
  }
}

/**
 * Logout user and clear Sentry user context
 */
export function logoutUser() {
  // Log logout event
  Sentry.logger.info("User logged out", {
    operation: "logoutUser",
  });
  
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'User logged out',
    level: 'info',
  });
  
  // Clear user context in Sentry
  Sentry.setUser(null);
}

/**
 * Register new user
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Newly created user data
 */
export async function registerUser(email, password) {
  // Log registration attempt
  Sentry.logger.info("User registration attempt", {
    email,
    operation: "registerUser",
  });
  
  try {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `Registration attempt for user ${email}`,
      level: 'info',
      data: {
        email,
      },
    });

    const response = await api.post('/api/auth/register', { 
      email, 
      password 
    });
    
    const { userId } = response;
    
    // Automatically log in after registration
    setCurrentUser(userId, email);
    
    // Log successful registration
    Sentry.logger.info("User registration successful", {
      userId,
      email,
    });
    
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `Successfully registered user ${email}`,
      level: 'info',
      data: {
        email,
        userId,
      },
    });
    
    return response;
  } catch (error) {
    // Log registration failure
    Sentry.logger.error("User registration failed", {
      email,
      errorMessage: error.message,
    });
    
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `Registration failed for user ${email}`,
      level: 'error',
      data: {
        email,
        errorMessage: error.message,
      },
    });

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        operation: 'registerUser',
        userEmail: email,
      },
      contexts: {
        auth: {
          email,
          operation: 'register',
        },
      },
    });
    
    throw error;
  }
}
