import path from 'path'
import { promises as fsPromises } from 'fs'
import unified from 'unified'
import markdown from 'remark-parse'
import html from 'remark-html'
import footnotes from 'remark-footnotes'

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

export const main = function() {
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
      unified()
        .use(markdown)
        .use(footnotes)
        .use(html)
        .process(doc, (err, file) => {
          console.log(String(file))
          fsPromises.writeFile('/home/jordan/pkr/out/modern-javascript.html', file, {encoding: 'utf-8'})
        })
    }),
  ])
}

export const render = async function(inputPath, outputPath) {
  const allFiles = await fsPromises.readdir(inputPath)
  const markdownFiles = allFiles.filter((fileName) => fileName.endsWith('.md'))
  const processor = unified().use([markdown, footnotes, html])
  const fileList = []

  await Promise.all(markdownFiles.map((mdFile) => {
    const htmlFile = mdFile.replace(/\.md$/, '.html')
    
    return processor
      .process(mdFile)
      .then((renderedFile) => {
        console.log('  ', mdFile, '-->', htmlFile)
        fileList.push(htmlFile)
        fsPromises.writeFile(path.join(outputPath, htmlFile), renderedFile.contents, {encoding: 'utf-8'})
      })
  }))

  let indexItems = fileList.sort().map((file) => {
    return '<li><a href="file://'+path.join(outputPath, file)+'">'+file+'</a></li>'
  })
  let indexHtml = '<h1>Index</h1>\n<ul>\n'+indexItems.join('\n')+'\n</ul>\n'

  await fsPromises.writeFile(path.join(outputPath, 'index.html'), indexHtml)
}