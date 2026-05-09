const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/task');
const Project = require('../models/project');
const { protect, checkProjectMember } = require('../middleware/auth');

router.use(protect);

// Helper: check if user can access task's project
const getTaskWithAccess = async (taskId, userId, userRole) => {
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color members owner')
    .populate('comments.user', 'name email avatar');

  if (!task) return { task: null, error: 'Task not found' };

  const project = task.project;
  if (userRole === 'admin') return { task, projectRole: 'admin' };

  const member = project.members.find(m => m.user.toString() === userId.toString());
  if (!member) return { task: null, error: 'Access denied' };

  return { task, projectRole: member.role };
};

// @GET /api/tasks - Get tasks (with filters)
router.get('/', async (req, res, next) => {
  try {
    const { project, status, priority, assignee, overdue, page = 1, limit = 50 } = req.query;

    // Build base filter based on user's projects
    let projectFilter;
    if (req.user.role === 'admin') {
      projectFilter = project ? { project } : {};
    } else {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      projectFilter = project
        ? (projectIds.some(id => id.toString() === project) ? { project } : { project: { $in: [] } })
        : { project: { $in: projectIds } };
    }

    const filter = { ...projectFilter };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee === 'me' ? req.user._id : assignee;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('project', 'name color')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter)
    ]);

    res.json({ status: 'success', data: tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// @GET /api/tasks/dashboard - Dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    let projectFilter;
    if (req.user.role === 'admin') {
      projectFilter = {};
    } else {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      projectFilter = { project: { $in: userProjects.map(p => p._id) } };
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [statusStats, myTasks, overdueTasks, dueSoon, recentActivity] = await Promise.all([
      Task.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.find({ ...projectFilter, assignee: req.user._id, status: { $ne: 'done' } })
        .populate('project', 'name color')
        .populate('assignee', 'name avatar')
        .sort({ dueDate: 1 })
        .limit(10),
      Task.find({ ...projectFilter, status: { $ne: 'done' }, dueDate: { $lt: now } })
        .populate('project', 'name color')
        .populate('assignee', 'name avatar')
        .sort({ dueDate: 1 })
        .limit(5),
      Task.find({ ...projectFilter, status: { $ne: 'done' }, dueDate: { $gte: now, $lte: weekFromNow } })
        .populate('project', 'name color')
        .populate('assignee', 'name avatar')
        .sort({ dueDate: 1 })
        .limit(5),
      Task.find(projectFilter)
        .populate('project', 'name color')
        .populate('createdBy', 'name avatar')
        .populate('assignee', 'name avatar')
        .sort({ updatedAt: -1 })
        .limit(8)
    ]);

    const stats = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 };
    statusStats.forEach(s => { stats[s._id] = s.count; });

    res.json({
      status: 'success',
      data: { stats, myTasks, overdueTasks, dueSoon, recentActivity }
    });
  } catch (err) {
    next(err);
  }
});

// @POST /api/tasks - Create task
router.post('/', [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('project').isMongoId().withMessage('Valid project ID required'),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (req.user.role !== 'admin') {
      const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'Not a project member.' });
    }

    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name color' }
    ]);

    res.status(201).json({ status: 'success', data: task });
  } catch (err) {
    next(err);
  }
});

// @GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { task, error } = await getTaskWithAccess(req.params.id, req.user._id, req.user.role);
    if (!task) return res.status(error === 'Task not found' ? 404 : 403).json({ message: error });
    res.json({ status: 'success', data: task });
  } catch (err) {
    next(err);
  }
});

// @PATCH /api/tasks/:id
router.patch('/:id', [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { task, error, projectRole } = await getTaskWithAccess(req.params.id, req.user._id, req.user.role);
    if (!task) return res.status(error === 'Task not found' ? 404 : 403).json({ message: error });

    const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags', 'estimatedHours', 'order'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name color' }
    ]);

    res.json({ status: 'success', data: task });
  } catch (err) {
    next(err);
  }
});

// @DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const project = task.project;
    if (req.user.role !== 'admin') {
      const member = project.members.find(m => m.user.toString() === req.user._id.toString());
      if (!member) return res.status(403).json({ message: 'Access denied.' });
      if (member.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only task creator or project admin can delete tasks.' });
      }
    }

    await task.deleteOne();
    res.json({ status: 'success', message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
});

// @POST /api/tasks/:id/comments
router.post('/:id/comments', [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { task, error } = await getTaskWithAccess(req.params.id, req.user._id, req.user.role);
    if (!task) return res.status(error === 'Task not found' ? 404 : 403).json({ message: error });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');

    res.status(201).json({ status: 'success', data: task.comments[task.comments.length - 1] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;