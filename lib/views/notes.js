import path from 'path'
import { promises as fsPromises } from 'fs'

const PKR_DIR = "/home/jordan/mypkr"

export const get = (req, res) => {
  return new Promise((resolve, _) => {
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
          resolve(req, res)
      })
      .catch((err) => {
        console.error(err.message)
        res.writeHeader(404)
        res.end()
        resolve(req, res)
      })
  })
}