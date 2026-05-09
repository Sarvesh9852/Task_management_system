const jwt = require('jsonwebtoken');
const User = require('../models/user');
const env = require('dotenv').config

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

// Restrict to admin role (global app admin)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check project membership
exports.checkProjectMember = async (req, res, next) => {
  try {
    const Project = require('../models/project');
    const projectId = req.params.projectId || req.body.project || req.query.project;

    if (!projectId) return next();

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // App admins have full access
    if (req.user.role === 'admin') {
      req.project = project;
      req.projectRole = 'admin';
      return next();
    }

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this project.' });
    }

    req.project = project;
    req.projectRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

// Check project admin role
exports.requireProjectAdmin = (req, res, next) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Project admin access required.'
    });
  }
  next();
};