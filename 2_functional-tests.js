const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const assert = chai.assert;

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let testThreadId;
  let testReplyId;

  test('POST /api/threads/test', function (done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({ text: 'Test Thread', delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('GET /api/threads/test', function (done) {
    chai.request(server)
      .get('/api/threads/test')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.property(res.body[0], '_id');
        assert.property(res.body[0], 'text');
        assert.property(res.body[0], 'created_on');
        assert.property(res.body[0], 'bumped_on');
        assert.isArray(res.body[0].replies);
        testThreadId = res.body[0]._id;
        done();
      });
  });

  test('PUT /api/threads/test', function (done) {
    chai.request(server)
      .put('/api/threads/test')
      .send({ report_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('POST /api/replies/test', function (done) {
    chai.request(server)
      .post('/api/replies/test')
      .send({ thread_id: testThreadId, text: 'Test Reply', delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('GET /api/replies/test', function (done) {
    chai.request(server)
      .get('/api/replies/test')
      .query({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, '_id');
        assert.property(res.body, 'text');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        assert.isArray(res.body.replies);
        assert.property(res.body.replies[0], '_id');
        assert.property(res.body.replies[0], 'text');
        assert.property(res.body.replies[0], 'created_on');
        testReplyId = res.body.replies[0]._id;
        done();
      });
  });

  test('PUT /api/replies/test', function (done) {
    chai.request(server)
      .put('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('DELETE /api/replies/test (incorrect password)', function (done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('DELETE /api/replies/test (correct password)', function (done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        // Confirm text is marked as deleted
        chai.request(server)
          .get('/api/replies/test')
          .query({ thread_id: testThreadId })
          .end((err, res) => {
            const reply = res.body.replies.find(r => r._id === testReplyId);
            assert.equal(reply.text, '[deleted]');
            done();
          });
      });
  });

  test('DELETE /api/threads/test (incorrect password)', function (done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('DELETE /api/threads/test (correct password)', function (done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        // Confirm the thread has been deleted
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            const thread = res.body.find(t => t._id === testThreadId);
            assert.isUndefined(thread);
            done();
          });
      });
  });
});
