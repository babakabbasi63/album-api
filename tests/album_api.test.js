import mongoose from 'mongoose'
import supertest from 'supertest'
import { describe, test, beforeEach, afterAll, expect } from 'vitest'
import app from '../app.js'
import Album from '../models/Album.js'
import User from '../models/User.js'
import connectMongoDB from '../db/mongodb.js'
import { MONGO_URI } from '../utils/config.js'
import testAlbums from './data.json'

const api = supertest(app)

// connect ONCE at the top
await connectMongoDB(MONGO_URI)

// ─── TASK 1: GET tests ────────────────────────────────────────────────────────
describe('Task 1 - GET /api/albums', () => {

  beforeEach(async () => {
    await Album.deleteMany({})
    await Album.create(testAlbums)
  })

  test('albums are returned as JSON with status 200', async () => {
    await api
      .get('/api/albums')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('correct number of albums is returned', async () => {
    const response = await api.get('/api/albums').expect(200)
    expect(response.body.albums).toHaveLength(testAlbums.length)
  })

  test('albums contain correct fields', async () => {
    const response = await api.get('/api/albums').expect(200)
    const firstAlbum = response.body.albums[0]
    expect(firstAlbum).toHaveProperty('title')
    expect(firstAlbum).toHaveProperty('artist')
    expect(firstAlbum).toHaveProperty('year')
    expect(firstAlbum).toHaveProperty('genre')
  })
})

// ─── TASK 2: POST tests ───────────────────────────────────────────────────────
describe('Task 2 - POST /api/albums', () => {

  // agent keeps session cookie between requests
  let agent

  beforeEach(async () => {
    // clear data
    await Album.deleteMany({})
    await Album.create(testAlbums)
    await User.deleteMany({})

    // create test user
    await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'user'
    })

    // create agent and login to get session
    agent = supertest.agent(app)
    await agent
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123'
      })
      .expect(200)
  })

  test('a valid album can be added', async () => {
    const newAlbum = {
      title: 'The Wall',
      artist: 'Pink Floyd',
      year: 1979,
      trackCount: 26,
      genre: 'Rock'
    }

    // use agent (logged in) for POST
    await agent
      .post('/api/albums')
      .send(newAlbum)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    // verify count increased by 1
    const response = await api.get('/api/albums')
    expect(response.body.albums).toHaveLength(testAlbums.length + 1)
  })

  test('newly added album has correct data', async () => {
    const newAlbum = {
      title: 'The Wall',
      artist: 'Pink Floyd',
      year: 1979,
      trackCount: 26,
      genre: 'Rock'
    }

    const response = await agent
      .post('/api/albums')
      .send(newAlbum)
      .expect(201)

    expect(response.body.album.title).toBe('The Wall')
    expect(response.body.album.artist).toBe('Pink Floyd')
    expect(response.body.album.year).toBe(1979)
    expect(response.body.album.genre).toBe('Rock')
  })

  test('album without required fields is rejected', async () => {
    const invalidAlbum = { genre: 'Rock' }

    await agent
      .post('/api/albums')
      .send(invalidAlbum)
      .expect(500)

    // verify count did NOT increase
    const response = await api.get('/api/albums')
    expect(response.body.albums).toHaveLength(testAlbums.length)
  })

  test('POST without login returns 401', async () => {
    const newAlbum = {
      title: 'The Wall',
      artist: 'Pink Floyd',
      year: 1979,
      trackCount: 26,
      genre: 'Rock'
    }

    // use api (not logged in) - should get 401
    await api
      .post('/api/albums')
      .send(newAlbum)
      .expect(401)
  })
})

// ─── TASK 3: DELETE tests ─────────────────────────────────────────────────────
describe('Task 3 - DELETE /api/albums/:id', () => {

  let agent

  beforeEach(async () => {
    // clear data
    await Album.deleteMany({})
    await Album.create(testAlbums)
    await User.deleteMany({})

    // create test user
    await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'user'
    })

    // create agent and login
    agent = supertest.agent(app)
    await agent
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123'
      })
      .expect(200)
  })

  test('an album can be deleted', async () => {
    // first create album as logged in user so they are the owner
    const created = await agent
      .post('/api/albums')
      .send({
        title: 'Test Album',
        artist: 'Test Artist',
        year: 2000,
        trackCount: 10,
        genre: 'Rock'
      })

    const albumId = created.body.album._id

    // delete it
    await agent
      .delete(`/api/albums/${albumId}`)
      .expect(200)

    // verify count decreased
    const albumsAfter = await api.get('/api/albums')
    expect(albumsAfter.body.albums).toHaveLength(testAlbums.length)
  })

  test('deleted album is no longer present', async () => {
    // create album as logged in user
    const created = await agent
      .post('/api/albums')
      .send({
        title: 'Album To Delete',
        artist: 'Test Artist',
        year: 2000,
        trackCount: 10,
        genre: 'Rock'
      })

    const albumId = created.body.album._id

    await agent
      .delete(`/api/albums/${albumId}`)
      .expect(200)

    // check it is gone
    const albumsAfter = await api.get('/api/albums')
    const titles = albumsAfter.body.albums.map(a => a.title)
    expect(titles).not.toContain('Album To Delete')
  })

  test('deleting non-existent album returns 404', async () => {
    const nonExistentId = '000000000000000000000000'
    await agent
      .delete(`/api/albums/${nonExistentId}`)
      .expect(404)
  })

  test('deleting with invalid id format returns 500', async () => {
    await agent
      .delete('/api/albums/this-is-not-a-valid-id')
      .expect(500)
  })

  test('DELETE without login returns 401', async () => {
    const albumsBefore = await api.get('/api/albums')
    const albumToDelete = albumsBefore.body.albums[0]

    // use api (not logged in) - should get 401
    await api
      .delete(`/api/albums/${albumToDelete._id}`)
      .expect(401)
  })

  // close connection ONLY here at the very end
  afterAll(async () => {
    await mongoose.connection.close()
  })
})