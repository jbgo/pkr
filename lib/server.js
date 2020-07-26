import { format } from 'util'
import http from 'http'
import { randomFillSync } from 'crypto'
import { Router } from './router.js'

const createRequestId = function() {
  const buf = Buffer.alloc(16)
  randomFillSync(buf)
  return buf.toString('hex')
}

export class HTTPServer {
  static start(options = {}) {
    const server = http.createServer()
    const router = new Router()

    // TODO validate configuration properties
    const address = options.address
    const port = options.port
    const repository = options.repository

    server.on('listening', () => {
      console.log("PKR listening on http://"+options.address+":"+options.port)
    })

    server.on('request', (req, res) => {
      const requestId = createRequestId()
      console.time(requestId)
      
      const httpMessage = {
        id: requestId,
        req: req,
        res: res,
        repository: repository
      }

      router
        .dispatch(req, res)
        .then(() => {
          console.timeLog(requestId, format('%d HTTP %s %s "%s"', res.statusCode, req.httpVersion, req.method, req.url))
        })
    })

    server.listen(port, address)
  }
}