const request = require('supertest');
const mongoose = require('mongoose');

let app;

beforeAll(() => {
  // App is loaded after setup.js sets env vars
  app = require('../src/app');
});

describe('Posts API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Post Test User',
        email: 'postuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    token = res.body.data.token;
    userId = res.body.data.user.id;
  });

  describe('POST /api/v1/posts', () => {
    it('should create a post with valid token', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'This is my first test post!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.text).toBe('This is my first test post!');
      expect(res.body.data.post.author).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({
          text: 'This should fail',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with empty text', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with text exceeding 2000 characters', async () => {
      const longText = 'a'.repeat(2001);
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: longText,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/posts', () => {
    beforeEach(async () => {
      // Create some posts
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `Post number ${i}` });
      }
    });

    it('should get feed posts', async () => {
      const res = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toHaveLength(5);
      expect(res.body.meta.pagination).toBeDefined();
    });

    it('should paginate posts', async () => {
      const res = await request(app)
        .get('/api/v1/posts?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(2);
      expect(res.body.meta.pagination.pages).toBe(3);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Post to retrieve' });
      postId = res.body.data.post.id;
    });

    it('should get a single post', async () => {
      const res = await request(app)
        .get(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.text).toBe('Post to retrieve');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/posts/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Original post' });
      postId = res.body.data.post.id;
    });

    it('should update own post', async () => {
      const res = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Updated post' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.text).toBe('Updated post');
    });

    it('should not update another user post', async () => {
      // Create another user
      const otherUser = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      const res = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUser.body.data.token}`)
        .send({ text: 'Hacked post' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Post to delete' });
      postId = res.body.data.post.id;
    });

    it('should delete own post', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });

    it('should not delete another user post', async () => {
      const otherUser = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Other User',
          email: 'other2@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      const res = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUser.body.data.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
