const express = require('express');
const { authorizeRoles } = require('../middleware/auth');
const Blog = require('../models/blog');
const User = require('../models/user');

const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'email role')
      .populate('editor', 'email role');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs' });
  }
});

// Create blog (Admin only)
router.post('/', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const blog = await Blog.create({
      title,
      content,
      author: req.user._id
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog' });
  }
});

// Update blog (Admin or assigned Editor)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (req.user.role !== 'ADMIN' && 
        (req.user.role !== 'EDITOR' || blog.editor?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    blog.title = title;
    blog.content = content;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog' });
  }
});

// Delete blog (Admin only)
router.delete('/:id', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await Blog.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog' });
  }
});

// Assign editor to blog (Admin only)
router.post('/:id/assign-editor', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { editorId } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.editor) {
      return res.status(400).json({ message: 'Blog already assigned to an editor' });
    }

    const editor = await User.findOne({
      _id: editorId,
      role: 'EDITOR'
    });

    if (!editor) {
      return res.status(400).json({ message: 'Invalid editor ID' });
    }

    blog.editor = editorId;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning editor' });
  }
});

module.exports = router;