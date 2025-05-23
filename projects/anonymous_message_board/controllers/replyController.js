const Thread = require('../models/Thread');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Create a new reply
exports.createReply = async (req, res) => {
  try {
    const { thread_id, text, delete_password } = req.body;
    const board = req.params.board;
    
    if (!thread_id || !text || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findById(thread_id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(delete_password, 10);
    
    // Add the reply
    thread.replies.push({
      _id: new mongoose.Types.ObjectId(),
      text,
      delete_password: hashedPassword,
      created_on: new Date(),
      reported: false
    });
    
    // Update bumped_on date
    thread.bumped_on = new Date();
    
    await thread.save();
    
    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a thread with all replies
exports.getThreadWithReplies = async (req, res) => {
  try {
    const board = req.params.board;
    const thread_id = req.query.thread_id;
    
    if (!thread_id) {
      return res.status(400).json({ error: 'Missing thread_id' });
    }
    
    const thread = await Thread.findById(thread_id)
      .select('-reported -delete_password')
      .lean();
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Remove sensitive fields from replies
    thread.replies = thread.replies.map(reply => {
      const { reported, delete_password, ...safeReply } = reply;
      return safeReply;
    });
    
    res.json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
  try {
    const { thread_id, reply_id, delete_password } = req.body;
    
    if (!thread_id || !reply_id || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findById(thread_id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const reply = thread.replies.id(reply_id);
    
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Check password
    const isPasswordCorrect = await bcrypt.compare(delete_password, reply.delete_password);
    
    if (!isPasswordCorrect) {
      return res.send('incorrect password');
    }
    
    // Change text to [deleted]
    reply.text = '[deleted]';
    await thread.save();
    
    res.send('success');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Report a reply
exports.reportReply = async (req, res) => {
  try {
    const { thread_id, reply_id } = req.body;
    
    if (!thread_id || !reply_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findById(thread_id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const reply = thread.replies.id(reply_id);
    
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    reply.reported = true;
    await thread.save();
    
    res.send('reported');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};