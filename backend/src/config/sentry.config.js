const Sentry = require('@sentry/node');

const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return null;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `tunisia-store@${process.env.npm_package_version || '1.0.0'}`,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter out specific errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Don't send 404 errors for static assets
      if (event.request?.url?.includes('/uploads/') && event.tags?.httpStatusCode === 404) {
        return null;
      }
      
      // Don't send validation errors
      if (error?.name === 'ValidationError') {
        return null;
      }
      
      return event;
    },
    
    // Attach user info when available
    initialScope: {
      tags: {
        app: 'tunisia-store',
        environment: process.env.NODE_ENV || 'development'
      }
    },
    
    // Ignore these error messages
    ignoreErrors: [
      /Loading chunk \d+ failed/,
      /ResizeObserver/,
      /Network Error/i
    ]
  });

  console.log('✅ Sentry error tracking initialized');
  console.log('📊 Environment:', process.env.NODE_ENV);

  return Sentry;
};

const captureException = (error, context = {}) => {
  if (!Sentry.getClient()) {
    console.error('Sentry not initialized:', error.message);
    return;
  }
  
  Sentry.withScope((scope) => {
    scope.setExtra('context', context);
    if (context.user) {
      scope.setUser({
        id: context.user.id || context.user._id,
        email: context.user.email,
        username: context.user.firstName + ' ' + context.user.lastName
      });
    }
    Sentry.captureException(error);
  });
};

const captureMessage = (message, level = 'info', context = {}) => {
  if (!Sentry.getClient()) {
    return;
  }
  
  Sentry.withScope((scope) => {
    scope.setExtra('context', context);
    Sentry.captureMessage(message, level);
  });
};

const addBreadcrumb = (message, category, data = {}) => {
  if (!Sentry.getClient()) {
    return;
  }
  
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info'
  });
};

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  Sentry
};