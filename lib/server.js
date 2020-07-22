import http from 'http'
import views from './views.js'

const Router = function() {
  this.routes = {
    'GET': [
      [/^\/$/, views.index.get],
      [/.*/, views.files.get]
    ]
  }

  this.dispatch = (req, res) => {
    let methodMatches = this.routes[req.method]
    if (!methodMatches) {
      res.writeHead(404)
      res.end()
    }

    let [_, reqHandler] = methodMatches.find(([pattern, handler]) => {
      if (req.url.match(pattern)) {
        return handler
      }
    })

    reqHandler(req, res)
  }

  return this
}

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
