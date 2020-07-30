import http from 'http'
import path from 'path'
import { strict as assert } from 'assert'
import { Repository, HTTPServer } from '../lib/index.js'

export class ServerTest {
  static setup() {
    const repo = new Repository({
      title: 'PKR Test Fixture',
      rootPath: path.join(process.cwd(), 'test/fixture/repo')
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
    return this.makeTestRequest('/does-not-exist', (res, body) => {
      assert.equal(res.statusCode, 404)
      assert.equal(body, '')
    })
  }
  
  testRenderIndex() {
    return this.makeTestRequest('/', (res, body) => {
      assert.equal(res.statusCode, 200)
      assert.match(body, /PKR Test Fixture/)
      assert.match(body, /href="\/test-note1"/)
      assert.match(body, /href="\/test-note2"/)
      assert.doesNotMatch(body, /href="\/test-note-private"/)
    })
  }

  testRenderNote() {
    return this.makeTestRequest('/test-note1', (res, body) => {
      assert.equal(res.statusCode, 200)
      assert.match(body, /Test Note 1/)
      assert.match(body, /This is a test note/)
    })
  }

  testRefuseToRenderPrivateNote() {
    return this.makeTestRequest('/test-note-private', (res, body) => {
      assert.equal(res.statusCode, 404)
      assert.equal(body, '')
    })
  }

  makeTestRequest(urlPath, callback) {
    return new Promise((resolve, reject) => {
      let url = 'http://localhost:8079' + urlPath
      let body = ""
      const req = http.request(url, (res) => {
        res.on('data', (chunk) => body += chunk)
        res.on('end', () => {
          try {
            callback(res, body)
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
}