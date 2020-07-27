import path from 'path'
import { promises as fsPromises } from 'fs'

export const get = (httpMessage) => {
  let body = []
  let { req, res, repository: repo } = httpMessage

  return new Promise((resolve, reject) => {
    fsPromises
      .readdir(repo.rootPath)

      .then((fileNames) => {
        body.push('<h1>'+repo.title+'</h1>')
        body.push('<ul>')
        return fileNames.filter((fileName) => fileName.endsWith('.md'))
      })

      .then((noteFiles) => {
        return Promise.all(noteFiles.map((fileName) => parseNote(repo.rootPath, fileName)))
      })

      .then((notes) => {
        notes
          .filter((note) => note.public)
          .forEach((note) => {
            body.push('<li><a href="/'+note.slug+'">')
            body.push(note.title)
            body.push('</a>')
            if (repo.debug) body.push('<pre>'+note.fullPath+'</pre>')
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
        resolve(httpMessage)
      })

      .catch((err) => {
        reject(err)
      })
  })
}

const parseNote = async (rootPath, fileName) => {
  let fullPath = path.join(rootPath, fileName)
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