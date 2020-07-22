import http from 'http'
import { Router } from './router.js'

export const start = function(options = {}) {
  const server = http.createServer()
  const router = new Router()

  server.on('listening', () => {
    console.log("PKR listening on http://"+options.address+":"+options.port)
  })

  server.on('request', (req, res) => {
    router.dispatch(req, res)
    console.log('HTTP '+req.httpVersion+' '+req.method+' "'+req.url+'" '+res.statusCode+' '+res.statusMessage)
  })

  server.listen(options.port, options.address)
}
