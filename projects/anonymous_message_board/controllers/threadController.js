const Thread = require('../models/Thread');
const bcrypt = require('bcrypt');

// Create a new thread
exports.createThread = async (req, res) => {
  try {
    const { text, delete_password } = req.body;
    const board = req.params.board;
    
    if (!text || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(delete_password, 10);
    
    const newThread = new Thread({
      text,
      delete_password: hashedPassword,
      board
    });

    await newThread.save();
    
    res.redirect(`/b/${board}/`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get the 10 most recent threads with 3 replies each
exports.getThreads = async (req, res) => {
  try {
    const board = req.params.board;
    
    const threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .select('-reported -delete_password')
      .lean();
    
    // Limit to 3 most recent replies per thread and remove sensitive fields
    const threadsWithLimitedReplies = threads.map(thread => {
      const limitedReplies = thread.replies
        .sort((a, b) => b.created_on - a.created_on)
        .slice(0, 3)
        .map(reply => {
          const { reported, delete_password, ...safeReply } = reply;
          return safeReply;
        });
      
      return { ...thread, replies: limitedReplies };
    });
    
    res.json(threadsWithLimitedReplies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a thread
exports.deleteThread = async (req, res) => {
  try {
    const { thread_id, delete_password } = req.body;
    
    if (!thread_id || !delete_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const thread = await Thread.findById(thread_id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Check password
    const isPasswordCorrect = await bcrypt.compare(delete_password, thread.delete_password);
    
    if (!isPasswordCorrect) {
      return res.send('incorrect password');
    }
    
    await Thread.findByIdAndDelete(thread_id);
    
    res.send('success');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Report a thread
exports.reportThread = async (req, res) => {
  try {
    const { thread_id } = req.body;
    
    if (!thread_id) {
      return res.status(400).json({ error: 'Missing thread_id' });
    }
    
    const thread = await Thread.findById(thread_id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    thread.reported = true;
    await thread.save();
    
    res.send('reported');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};