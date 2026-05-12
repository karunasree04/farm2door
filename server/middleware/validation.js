const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least 1 lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least 1 number'),
  body('phone').optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
  handleValidation
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').isIn(['vegetables','fruits','dairy','grains','leafy','organic','herbs','other'])
    .withMessage('Invalid category'),
  body('basePrice').isFloat({ min: 0.01 }).withMessage('Base price must be positive'),
  body('stock').isFloat({ min: 0 }).withMessage('Stock must be 0 or more'),
  handleValidation
];

module.exports = { registerValidation, loginValidation, productValidation, handleValidation };
