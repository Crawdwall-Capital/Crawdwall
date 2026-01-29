/**
 * Standard success response format
 */
export const successResponse = (res, data, statusCode = 200, token = null, role = null) => {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString()
    };

    if (token) response.token = token;
    if (role) response.role = role;

    return res.status(statusCode).json(response);
};

/**
 * Authentication success response format
 */
export const authSuccessResponse = (res, data, token, role, message = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message: message || 'Authentication successful',
        token,
        role,
        timestamp: new Date().toISOString()
    });
};

/**
 * Standard error response format
 */
export const errorResponse = (res, message, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Validation error response format
 */
export const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
    });
};

/**
 * Not found response format
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
    return res.status(404).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Unauthorized response format
 */
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
    return res.status(401).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Forbidden response format
 */
export const forbiddenResponse = (res, message = 'Access forbidden') => {
    return res.status(403).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Internal server error response format
 */
export const serverErrorResponse = (res, message = 'Internal server error') => {
    return res.status(500).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};