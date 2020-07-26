import path from 'path'
import { promises as fsPromises } from 'fs'

// TODO get from options
const DEBUG = false
const PKR_DIR = "/home/jordan/mypkr"

export const get = (req, res) => {
  return new Promise((resolve, _) => {
    fsPromises
      .readdir(PKR_DIR)
      .then((fileNames) => {
        let body = []
        body.push('<h1>My PKR</h1>') // TODO get from options
        body.push('<ul>')

        let noteFiles = fileNames.filter((fileName) => fileName.endsWith('.md'))
        Promise
          .all(noteFiles.map(parseNote))
          .then((notes) => {
            notes
              .filter((note) => note.public)
              .forEach((note) => {
                body.push('<li><a href="/'+note.slug+'">')
                body.push(note.title)
                body.push('</a>')
                if (DEBUG) body.push('<pre>'+note.fullPath+'</pre>')
                if (note.tags) {
                  body.push('<p>')
                  body.push(note.tags.map((tag) => '#'+tag).join(' '))
                  body.push('</p>')
                }
                body.push('</li>')
              })
          })
          .then(() => {
            body.push('</ul>')
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(body.join('\n'), 'utf-8')
            resolve(req, res)
          })
    })
  })
}

const parseNote = async (fileName) => {
  let fullPath = path.join(PKR_DIR, fileName)
  let contents = await fsPromises.readFile(fullPath, {encoding: 'utf-8'})
  let lines = contents.split('\n')
  let note = {public: false}
  note.slug = fileName.replace(/\.md$/, '')
  note.fileName = fileName
  note.fullPath = fullPath
  lines.forEach((line) => {
    // TODO good opportunity for unit tests
    let titleMatch = line.match(/^\s*\#\s*(.+)/)
    if (titleMatch && !note.title) note.title = titleMatch[1]
    let tagsMatch = line.match(/^\.tags:\s*(.+)/)
    if (tagsMatch) note.tags = tagsMatch[1].split(' ')
    let publicMatch = line.match(/^\.public:\s*true/)
    if (publicMatch) note.public = true
  })
  return note
}