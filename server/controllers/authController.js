const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Farmer = require('../models/Farmer');

const signToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set in .env file');
  return jwt.sign({ id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const userObj = user.toJSON ? user.toJSON() : user.toObject();
  delete userObj.password;
  res.status(statusCode).json({ success: true, token, user: userObj });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const allowedRoles = ['customer', 'farmer', 'delivery'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const emailLower = email.toLowerCase().trim();
    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // User model pre-save hook will hash the password — pass plaintext here
    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password,        // <-- plaintext; pre-save hook hashes it
      phone: phone || '',
      role: userRole,
      isActive: true,
      isVerified: false
    });

    if (userRole === 'farmer') {
      await Farmer.create({
        userId: user._id,
        farmName: req.body.farmName || `${name.trim()}'s Farm`,
        location: req.body.location || { city: 'Hyderabad', state: 'Telangana' },
        crops: req.body.crops || [],
        isActive: true
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const { password } = req.body;

    // Must use select('+password') because it's select:false in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'avatar', 'language'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword; // pre-save hook will hash
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) { next(error); }
};
