exports.validationError = (res, message) => {
    return res.status(400).json({
      success: false,
      error: message,
    });
  };
  
  exports.serverError = (res, error) => {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  };