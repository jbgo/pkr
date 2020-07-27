import path from 'path'
import { promises as fsPromises } from 'fs'
import { rejects } from 'assert'

const PKR_DIR = "/home/jordan/mypkr"

export const get = (httpMessage) => {
  let { req, res } = httpMessage

  return new Promise((resolve, reject) => {
    let notePath = path.join(PKR_DIR, req.url.split('/')[1] + '.md')

    fsPromises
      .readFile(notePath)
      .then((contents) => {
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