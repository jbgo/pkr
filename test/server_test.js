import http from 'http'
import { strict as assert } from 'assert'
import { Repository, HTTPServer } from '../lib/index.js'

// TODO: tests
// # Test 1: 404 Not Found
// - create tests/fixtures/repo/*.md
// - start pkr/server
// - make get request for file that does not exist
// - assert 404 response

export class ServerTest {
  static setup() {
    const repo = new Repository({
      title: 'Open Solitude',
      rootPath: '/home/jordan/mypkr'
    })

    this.server = HTTPServer.start({
      repository: repo,
      address: 'localhost',
      port: 8079
    })

    return new Promise((resolve) =>
      this.server.on('listening', resolve))
  }

  static teardown() {
    this.server.close()
  }

  test404NotFound() {
    return new Promise((resolve, reject) => {
      const req = http.request('http://localhost:8079/does-not-exist', (res) => {
        res.on('data', () => {})
        res.on('end', () => {
          try {
            assert.equal(res.statusCode, 404)
            resolve()
          } catch(err) {
            reject(err)
          }
        })
      })
      req.on('error', reject)
      req.end()
    })
  }
  
  testRenderIndex() {
    assert.ok(true, "I'm doing well")
  }

  testRenderNote() {
    throw new Error("I have no idea what just happened")
  }
}