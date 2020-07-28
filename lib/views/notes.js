import path from 'path'
import { promises as fsPromises } from 'fs'
import { rejects } from 'assert'

export const get = (httpMessage) => {
  let { req, res, repository: repo } = httpMessage

  return new Promise((resolve, reject) => {
    let notePath = path.join(repo.rootPath, req.url.split('/')[1] + '.md')

    fsPromises
      .readFile(notePath)
      .then((contents) => {
        let lines = contents.toString('utf-8').split('\n')
        let is_public = lines.some((line) => line.startsWith('.public: true'))

        if (!is_public) {
          throw new Error('refusing to serve a private note')
        }

        let body = []
        body.push('<h1>'+req.url+'</h1>')
        body.push('<pre>'+contents+'</pre>')
        body.push('<p><a href="/">&laquo; All Notes</a></p>')
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end(body.join('\n'), 'utf-8')
        resolve(httpMessage)
      })
      .catch((err) => {
        process.nextTick(console.timeLog, httpMessage.id, err.stack)
        res.writeHeader(404)
        res.end()
        resolve(httpMessage)
      })
  })
}