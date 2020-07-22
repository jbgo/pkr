import { start } from "./lib/server.js"

start({
  repo: "/home/jordan/mypkr",
  root: "/home/jordan/pkr/out",
  address: "0.0.0.0",
  port: 8080
})