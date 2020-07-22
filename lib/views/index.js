export const get = (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.write('<h1>Hello, PKR!</h1>')
  res.end()
}