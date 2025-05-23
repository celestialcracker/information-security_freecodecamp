const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);

suite('Functional Tests', function() {
  // Variables to store test data
  let testBoard = 'test-board';
  let testThreadId;
  let testReplyId;
  let testPassword = 'testPassword123';
  let invalidPassword = 'wrongPassword';
  
  suite('API Threads tests', function() {
    // Test 1: Creating a new thread
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post(`/api/threads/${testBoard}`)
        .send({
          text: 'Test Thread',
          delete_password: testPassword
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res).to.redirectTo(new RegExp(`/b/${testBoard}/$`));
          done();
        });
    });

    // Test 2: Viewing the 10 most recent threads with 3 replies each
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get(`/api/threads/${testBoard}`)
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body[0]).to.include.keys('_id', 'text', 'created_on', 'bumped_on', 'replies');
          expect(res.body[0].replies).to.be.an('array');
          expect(res.body[0]).to.not.have.property('delete_password');
          expect(res.body[0]).to.not.have.property('reported');
          
          // Store the thread id for later tests
          testThreadId = res.body[0]._id;
          
          done();
        });
    });

    // Test 3: Reporting a thread
    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put(`/api/threads/${testBoard}`)
        .send({ thread_id: testThreadId })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('reported');
          done();
        });
    });

    // Test 4: Creating a new reply
    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          text: 'Test Reply',
          delete_password: testPassword
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res).to.redirectTo(new RegExp(`/b/${testBoard}/${testThreadId}`));
          done();
        });
    });

    // Test 5: Viewing a single thread with all replies
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get(`/api/replies/${testBoard}`)
        .query({ thread_id: testThreadId })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('_id', 'text', 'created_on', 'bumped_on', 'replies');
          expect(res.body.replies).to.be.an('array');
          expect(res.body.replies[0]).to.include.keys('_id', 'text', 'created_on');
          expect(res.body.replies[0]).to.not.have.property('delete_password');
          expect(res.body.replies[0]).to.not.have.property('reported');
          
          // Store the reply id for later tests
          testReplyId = res.body.replies[0]._id;
          
          done();
        });
    });

    // Test 6: Reporting a reply
    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('reported');
          done();
        });
    });

    // Test 7: Deleting a reply with the incorrect password
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId,
          delete_password: invalidPassword
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('incorrect password');
          done();
        });
    });

    // Test 8: Deleting a reply with the correct password
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId,
          delete_password: testPassword
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('success');
          done();
        });
    });

    // Test 9: Deleting a thread with the incorrect password
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
          thread_id: testThreadId,
          delete_password: invalidPassword
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('incorrect password');
          done();
        });
    });

    // Test 10: Deleting a thread with the correct password
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
          thread_id: testThreadId,
          delete_password: testPassword
        })
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('success');
          done();
        });
    });
  });
});