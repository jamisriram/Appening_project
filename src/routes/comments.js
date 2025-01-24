const express = require('express');
const Comment = require('../models/comment');

const router = express.Router();

// Get comments for a blog
router.get('/blog/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    const comments = await Comment.find({ blog: blogId })
      .populate('user', 'email');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Add comment
router.post('/', async (req, res) => {
  try {
    const { blogId, content } = req.body;
    const comment = await Comment.create({
      content,
      blog: blogId,
      user: req.user._id
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating comment' });
  }
});

// Delete comment (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await comment.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

module.exports = router;