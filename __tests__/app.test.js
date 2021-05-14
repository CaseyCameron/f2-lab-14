import client from '../lib/client.js';
import supertest from 'supertest';
import app from '../lib/app.js';
import { execSync } from 'child_process';

const request = supertest(app);

describe('API Routes', () => {

  afterAll(async () => {
    return client.end();
  });

  describe('/api/todos', () => {
    let user;

    beforeAll(async () => {
      execSync('npm run recreate-tables');

      const response = await request
        .post('/api/auth/signup')
        .send({
          name: 'Me the User',
          email: 'me@user.com',
          password: 'password'
        });

      expect(response.status).toBe(200);

      user = response.body;
    });

    // append the token to your requests:
    //  .set('Authorization', user.token);

    let chore = {
      id: expect.any(Number),
      task: 'Sweep and mop',
      completed: false
    };

    it('POST /api/todos', async () => {

      const response = await request
        .post('/api/todos')
        .set('Authorization', user.token)
        .send(chore);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        userId: user.id,
        ...chore
      });
      chore = response.body;
    });

    it('GET /api/me/todos', async () => {

      const response = await request.get('/api/me/todos')
        .set('Authorization', user.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([chore]);
    });

    it('PUT /api/todos/:id', async () => {
      chore.completed = true;

      const response = await request
        .put(`/api/todos/${chore.id}`)
        .set('Authorization', user.token)
        .send(chore);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(chore);
    });

    it('DELETE /api/todos/:id', async () => {
      //delete specific item
      const response = await request
        .delete(`/api/todos/${chore.id}`)
        .set('Authorization', user.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(chore);

      //make sure it's gone
      const getResponse = await request.get('/api/me/todos')
        .set('Authorization', user.token);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.find(item => item.id === chore.id)).toBeUndefined();
    });

  });
});