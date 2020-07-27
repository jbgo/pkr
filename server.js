import { Repository, HTTPServer } from './lib/index.js'

const repo = new Repository({
  title: 'Open Solitude',
  rootPath: '/home/jordan/mypkr'
})

HTTPServer.start({
  repository: repo,
  address: 'localhost',
  port: 8080
})