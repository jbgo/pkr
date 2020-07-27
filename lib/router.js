import views from './views.js'

export class Router {
  constructor() {
    this.routeMap = {
      'GET': [
        [/^\/$/, views.index.get],
        [/.*/, views.notes.get]
      ]
    }
  }

  dispatch(httpMessage) {
    let { req, res } = httpMessage

    let routes = this.routeMap[req.method]
    if (!routes) return this.respondWithStatus(400, res)

    let responder = this.responderForURL(routes, req.url)
    if (!responder) return this.respondWithStatus(404, res)

    return responder(httpMessage)
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