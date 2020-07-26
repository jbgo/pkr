import views from './views.js'

class Router {
  constructor() {
    this.routeMap = {
      'GET': [
        [/^\/$/, views.index.get],
        [/.*/, views.notes.get]
      ]
    }
  }

  dispatch(req, res) {
    let routes = this.routeMap[req.method]
    if (!routes) return this.respondWithStatus(400, res)

    let responder = this.responderForURL(routes, req.url)
    if (!responder) return this.respondWithStatus(404, res)

    return responder(req, res)
  }

  responderForURL(routes, url) {
    let [_, responder] = routes.find(([pattern, responder]) => {
      let [urlWithoutQuery, _] = url.split('?')
      if (urlWithoutQuery.match(pattern)) return responder
    })

    return responder
  }

  respondWithStatus(statusCode, res) {
    res.writeHead(statusCode)
    res.end()
  }
}

export { Router }