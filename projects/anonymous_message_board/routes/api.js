const express = require('express');
const router = express.Router();

const threadController = require('../controllers/threadController');
const replyController = require('../controllers/replyController');

// Thread routes
router.post('/threads/:board', threadController.createThread);
router.get('/threads/:board', threadController.getThreads);
router.delete('/threads/:board', threadController.deleteThread);
router.put('/threads/:board', threadController.reportThread);

// Reply routes
router.post('/replies/:board', replyController.createReply);
router.get('/replies/:board', replyController.getThreadWithReplies);
router.delete('/replies/:board', replyController.deleteReply);
router.put('/replies/:board', replyController.reportReply);

module.exports = router;