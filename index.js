import { promises as fsPromises } from 'fs';

const listdir = async function(path) {
  return await fsPromises.readdir(path)
}

const cat = async function(path) {
  return await fsPromises.readFile(path, {encoding: 'utf-8'})
}

const excerpt = (text, lines = 3) => {
  return text.split("\n").slice(0, lines).join("\n")
}

const extractMetadata = (text) => {
  let meta = {}
  let lines = text.split("\n")
  let doc_lines = []

  let titleMatch = /^# ?(.+)/.exec(lines[0])
  if (titleMatch) meta.title = titleMatch[1]

  let pattern = /^\.(\w+):(.+)/
  lines.forEach((line) => {
    let match = pattern.exec(line)
    if (match) {
      meta[match[1]] = match[2]
    } else {
      doc_lines.push(line)
    }
  })

  return [meta, doc_lines.join("\n")]
}

const main = function() {
  Promise.all([
    listdir('./').then((dirNames) => {
      console.log('===$ listdir .')
      console.log(dirNames.splice(0, 5).join('\n'))
      console.log()
    }),
    cat('/home/jordan/mypkr/modern-javascript.md').then((contents) => {
      console.log('===$ cat modern-javascript.md')
      let [meta, doc] = extractMetadata(contents)
      Object.entries(meta).forEach(([key, value]) => {
        console.log(key, '=>', value)
      })
      fsPromises.writeFile('/home/jordan/pkr/out/modern-javascript.html', doc, {encoding: 'utf-8'})
    }),
  ])
}

main()