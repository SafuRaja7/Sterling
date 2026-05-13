const http = require('http');
const server = http.createServer((req, res) => {
  res.end('OK');
});
console.log("Attempting to listen...");
server.listen(5005, () => {
  console.log("Listening on 5005");
});
