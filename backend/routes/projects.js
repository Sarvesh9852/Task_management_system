const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/project');
const Task = require('../models/task');
const User = require('../models/user');
const { protect, checkProjectMember, requireProjectAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @GET /api/projects - Get all projects for current user
router.get('/', async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? { isArchived: false }
      : { 'members.user': req.user._id, isArchived: false };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (project) => {
      const taskStats = await Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const counts = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0, total: 0 };
      taskStats.forEach(s => {
        counts[s._id] = s.count;
        counts.total += s.count;
      });

      return { ...project.toJSON(), taskCounts: counts };
    }));

    res.json({ status: 'success', data: projectsWithCounts });
  } catch (err) {
    next(err);
  }
});

// @POST /api/projects - Create project
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.create({
      ...req.body,
      owner: req.user._id
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.status(201).json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
});

// @GET /api/projects/:id
router.get('/:projectId', checkProjectMember, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0, total: 0 };
    taskStats.forEach(s => {
      counts[s._id] = s.count;
      counts.total += s.count;
    });

    res.json({ status: 'success', data: { ...project.toJSON(), taskCounts: counts } });
  } catch (err) {
    next(err);
  }
});

// @PATCH /api/projects/:id
router.patch('/:projectId', checkProjectMember, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const allowedFields = ['name', 'description', 'status', 'priority', 'color', 'startDate', 'endDate', 'tags'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const project = await Project.findByIdAndUpdate(req.params.projectId, updates, {
      new: true, runValidators: true
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/projects/:id
router.delete('/:projectId', checkProjectMember, requireProjectAdmin, async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ status: 'success', message: 'Project and all tasks deleted.' });
  } catch (err) {
    next(err);
  }
});

// @POST /api/projects/:id/members - Add member
router.post('/:projectId/members', checkProjectMember, requireProjectAdmin, [
  body('email').isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, role = 'member' } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with that email.' });
    }

    const project = req.project;
    const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member.' });
    }

    project.members.push({ user: userToAdd._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/projects/:id/members/:userId
router.delete('/:projectId/members/:userId', checkProjectMember, requireProjectAdmin, async (req, res, next) => {
  try {
    const project = req.project;

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove project owner.' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
});

// @GET /api/projects/:id/stats
router.get('/:projectId/stats', checkProjectMember, async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    const [statusStats, priorityStats, memberStats, overdueCount] = await Promise.all([
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId), assignee: { $ne: null } } },
        { $group: { _id: '$assignee', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }
      ]),
      Task.countDocuments({
        project: projectId,
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() }
      })
    ]);

    res.json({
      status: 'success',
      data: { statusStats, priorityStats, memberStats, overdueCount }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;