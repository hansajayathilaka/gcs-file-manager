/**
 * Centralized logging utility for the application
 */

import { getRuntimeConfig } from './runtime-config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  bucket?: string;
  operation?: string;
  [key: string]: any;
}

class Logger {
  private get isDevelopment() {
    return getRuntimeConfig().nodeEnv === 'development';
  }
  
  private get isProduction() {
    return getRuntimeConfig().nodeEnv === 'production';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
      if (data) {
        console.log('Debug data:', data);
      }
    }
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('info', message, context);
    if (this.isDevelopment) {
      console.log(formattedMessage);
    } else if (this.isProduction) {
      // In production, you might want to send to a logging service
      console.log(formattedMessage);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(formattedMessage);
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: any, context?: LogContext): void {
    const formattedMessage = this.formatMessage('error', message, context);
    console.error(formattedMessage);
    
    if (error) {
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        });
      } else {
        console.error('Error details:', error);
      }
    }

    // In production, you might want to send to error reporting service
    if (this.isProduction && error) {
      // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
    }
  }

  /**
   * Log API operation results
   */
  apiOperation(operation: string, success: boolean, context?: LogContext): void {
    const level = success ? 'info' : 'error';
    const message = `API Operation: ${operation} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.info(message, { ...context, operation });
    } else {
      this.error(message, undefined, { ...context, operation });
    }
  }

  /**
   * Log user operations for audit trail
   */
  userOperation(userId: string, operation: string, details?: any): void {
    this.info(`User operation: ${operation}`, {
      userId,
      operation,
      details: this.isDevelopment ? details : undefined
    });
  }

  /**
   * Log file operations
   */
  fileOperation(operation: string, bucket: string, filePath: string, userId?: string): void {
    this.debug(`File operation: ${operation}`, undefined, {
      operation,
      bucket,
      filePath,
      userId
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const logError = (message: string, error?: any, context?: LogContext) => logger.error(message, error, context);
export const logDebug = (message: string, data?: any, context?: LogContext) => logger.debug(message, data, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);