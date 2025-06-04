const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let testThreadId;
  let testReplyId;
  const testBoard = 'test-board';
  const testPassword = 'test-password';
  const wrongPassword = 'wrong-password';

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
        chai.request(server)
          .post(`/api/threads/${testBoard}`)
          .send({
            text: 'Test thread text',
            delete_password: testPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'reported');
            assert.property(res.body, 'delete_password');
            assert.property(res.body, 'replies');
            assert.equal(res.body.text, 'Test thread text');
            assert.equal(res.body.reported, false);
            assert.isArray(res.body.replies);
            assert.equal(res.body.replies.length, 0);
            testThreadId = res.body._id;
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            if (res.body.length > 0) {
              assert.property(res.body[0], '_id');
              assert.property(res.body[0], 'text');
              assert.property(res.body[0], 'created_on');
              assert.property(res.body[0], 'bumped_on');
              assert.property(res.body[0], 'replies');
              assert.notProperty(res.body[0], 'reported');
              assert.notProperty(res.body[0], 'delete_password');
              assert.isArray(res.body[0].replies);
              assert.isAtMost(res.body[0].replies.length, 3);
              if (res.body[0].replies.length > 0) {
                assert.notProperty(res.body[0].replies[0], 'reported');
                assert.notProperty(res.body[0].replies[0], 'delete_password');
              }
            }
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
        chai.request(server)
          .delete(`/api/threads/${testBoard}`)
          .send({
            thread_id: testThreadId,
            delete_password: wrongPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
        // Create a new thread first
        chai.request(server)
          .post(`/api/threads/${testBoard}`)
          .send({
            text: 'Thread to delete',
            delete_password: testPassword
          })
          .end(function(err, res) {
            const threadToDelete = res.body._id;
            
            chai.request(server)
              .delete(`/api/threads/${testBoard}`)
              .send({
                thread_id: threadToDelete,
                delete_password: testPassword
              })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
              });
          });
      });
    });
    
    suite('PUT', function() {
      test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
        chai.request(server)
          .put(`/api/threads/${testBoard}`)
          .send({
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
          });
      });
    });
    
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Test reply text',
            delete_password: testPassword,
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'delete_password');
            assert.property(res.body, 'reported');
            assert.equal(res.body.text, 'Test reply text');
            assert.equal(res.body.reported, false);
            testReplyId = res.body._id;
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get(`/api/replies/${testBoard}`)
          .query({ thread_id: testThreadId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'replies');
            assert.notProperty(res.body, 'reported');
            assert.notProperty(res.body, 'delete_password');
            assert.isArray(res.body.replies);
            if (res.body.replies.length > 0) {
              assert.property(res.body.replies[0], '_id');
              assert.property(res.body.replies[0], 'text');
              assert.property(res.body.replies[0], 'created_on');
              assert.notProperty(res.body.replies[0], 'reported');
              assert.notProperty(res.body.replies[0], 'delete_password');
            }
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
        chai.request(server)
          .delete(`/api/replies/${testBoard}`)
          .send({
            thread_id: testThreadId,
            reply_id: testReplyId,
            delete_password: wrongPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
        chai.request(server)
          .delete(`/api/replies/${testBoard}`)
          .send({
            thread_id: testThreadId,
            reply_id: testReplyId,
            delete_password: testPassword
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
        // Create a new reply first since we deleted the previous one
        chai.request(server)
          .post(`/api/replies/${testBoard}`)
          .send({
            text: 'Reply to report',
            delete_password: testPassword,
            thread_id: testThreadId
          })
          .end(function(err, res) {
            const replyToReport = res.body._id;
            
            chai.request(server)
              .put(`/api/replies/${testBoard}`)
              .send({
                thread_id: testThreadId,
                reply_id: replyToReport
              })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                done();
              });
          });
      });
    });
    
  });

});
