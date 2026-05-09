const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// @GET /api/users - Get all users (admin only)
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).sort({ name: 1 });
    res.json({ status: 'success', data: users });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/search - Search users by email/name
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ status: 'success', data: [] });
    }

    const users = await User.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).limit(10).select('name email avatar role');

    res.json({ status: 'success', data: users });
  } catch (err) {
    next(err);
  }
});

// @PATCH /api/users/:id/role - Change user role (admin only)
router.patch('/:id/role', restrictTo('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/users/:id - Deactivate user (admin only)
router.delete('/:id', restrictTo('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ status: 'success', message: 'User deactivated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;