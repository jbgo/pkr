import http from 'http'
import { randomFillSync } from 'crypto'
import { Router } from './router.js'

export const start = function(options = {}) {
  const server = http.createServer()
  const router = new Router()

  server.on('listening', () => {
    console.log("PKR listening on http://"+options.address+":"+options.port)
  })

  server.on('request', (req, res) => {
    let requestId = createRequestId()
    console.time(requestId)

    router
      .dispatch(req, res)
      .then(() => {
        console.timeLog(requestId, 'HTTP '+req.httpVersion+' '+req.method+' "'+req.url+'" '+res.statusCode+' '+res.statusMessage)
      })
  })

  server.listen(options.port, options.address)
}

const createRequestId = function() {
  const buf = Buffer.alloc(16)
  randomFillSync(buf)
  return buf.toString('hex')
}