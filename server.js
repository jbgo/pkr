import { Repository, HTTPServer } from './lib/index.js'

const repo = new Repository({
  title: 'Open Solitude',
  rootPath: '/home/jordan/pkr'
})

HTTPServer.start({
  repository: repo,
  address: 'localhost',
  port: 8080
})