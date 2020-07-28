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
      // TODO use a custom logger
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
        .dispatch(httpMessage)
        .then((httpMessage) => {
          let { req, res } = httpMessage
          console.timeLog(httpMessage.id, format('%d HTTP %s %s "%s"', res.statusCode, req.httpVersion, req.method, req.url))
        }).catch((err) => {
          console.timeLog(httpMessage.id, err.stack)
          res.statusCode = 500
          res.end()
        })
    })

    server.listen(port, address)

    return server
  }
}