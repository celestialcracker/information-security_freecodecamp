'use strict';

const { MongoClient, ObjectId } = require('mongodb');

let db;

// Connect to MongoDB
MongoClient.connect(process.env.DB, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db('messageboard');
  })
  .catch(error => console.error(error));

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        const board = req.params.board;
        
        const thread = {
          text: text,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          delete_password: delete_password,
          replies: []
        };
        
        const result = await db.collection(board).insertOne(thread);
        res.json(thread);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        
        // Get 10 most recent threads (sorted by bumped_on)
        const threads = await db.collection(board)
          .find({})
          .sort({ bumped_on: -1 })
          .limit(10)
          .toArray();
        
        // Format response - exclude reported and delete_password, limit replies to 3
        const response = threads.map(thread => {
          return {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies
              .slice(-3) // Get last 3 replies
              .map(reply => ({
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on
              }))
          };
        });
        
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    
    .delete(async (req, res) => {
      try {
        const board = req.params.board;
        const { thread_id, delete_password } = req.body;
        
        const thread = await db.collection(board).findOne({ _id: new ObjectId(thread_id) });
        
        if (!thread) {
          return res.send('incorrect password');
        }
        
        if (thread.delete_password !== delete_password) {
          return res.send('incorrect password');
        }
        
        await db.collection(board).deleteOne({ _id: new ObjectId(thread_id) });
        res.send('success');
      } catch (error) {
        res.send('incorrect password');
      }
    })
    
    .put(async (req, res) => {
      try {
        const board = req.params.board;
        const { thread_id } = req.body;
        
        await db.collection(board).updateOne(
          { _id: new ObjectId(thread_id) },
          { $set: { reported: true } }
        );
        
        res.send('reported');
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password, thread_id } = req.body;
        const board = req.params.board;
        
        const reply = {
          _id: new ObjectId(),
          text: text,
          created_on: new Date(),
          delete_password: delete_password,
          reported: false
        };
        
        // Update thread with new reply and bump the thread
        await db.collection(board).updateOne(
          { _id: new ObjectId(thread_id) },
          { 
            $push: { replies: reply },
            $set: { bumped_on: new Date() }
          }
        );
        
        res.json(reply);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        const { thread_id } = req.query;
        
        const thread = await db.collection(board).findOne({ _id: new ObjectId(thread_id) });
        
        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }
        
        // Format response - exclude reported and delete_password fields
        const response = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }))
        };
        
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    
    .delete(async (req, res) => {
      try {
        const board = req.params.board;
        const { thread_id, reply_id, delete_password } = req.body;
        
        const thread = await db.collection(board).findOne({ _id: new ObjectId(thread_id) });
        
        if (!thread) {
          return res.send('incorrect password');
        }
        
        const reply = thread.replies.find(r => r._id.toString() === reply_id);
        
        if (!reply || reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }
        
        // Update the reply text to [deleted]
        await db.collection(board).updateOne(
          { _id: new ObjectId(thread_id), 'replies._id': new ObjectId(reply_id) },
          { $set: { 'replies.$.text': '[deleted]' } }
        );
        
        res.send('success');
      } catch (error) {
        res.send('incorrect password');
      }
    })
    
    .put(async (req, res) => {
      try {
        const board = req.params.board;
        const { thread_id, reply_id } = req.body;
        
        await db.collection(board).updateOne(
          { _id: new ObjectId(thread_id), 'replies._id': new ObjectId(reply_id) },
          { $set: { 'replies.$.reported': true } }
        );
        
        res.send('reported');
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

};
