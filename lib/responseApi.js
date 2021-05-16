/**
 * @desc    This file contain Success and Error response for sending to client / user
 */

/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
exports.successApiRequest = (message, results, statusCode) => {
    return {
      message,
      error: false,
      code: statusCode,
      results
    };
  };
  
  /**
   * @desc    Send any error response
   *
   * @param   {string} message
   * @param   {number} statusCode
   */
  exports.errorApiRequest = (message, statusCode) => {
    // List of common HTTP request code
    const codes = [201, 400, 401, 404, 403, 422, 500];
  
    // Get matched code
    const findCode = codes.find((code) => code == statusCode);
  
    if (!findCode) statusCode = 500;
    else statusCode = findCode;
  
    return {
      message,
      code: statusCode,
      error: true
    };
  };
  
  /**
   * @desc    Send any validation response
   *
   * @param   {object | array} errors
   */
  exports.validationErrorApiRequest = (message, errors) => {
    return {
      message: "Validation errors: " + message,
      error: true,
      code: 422,
      errors: errors
    };
  };
  