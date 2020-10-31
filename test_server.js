const http = require('http');
const fs = require('fs')

const requestListener = function (req, res) {
    fs.readFile( __dirname + req.url, 'utf8', (err, data)=>{
        res.writeHead(200, { 'Content-Type': (
            req.url.match(/.html$/) ? 'text/html' :
            req.url.match(/.js$/) ? 'text/javascript' :
            'text/plain'
        ) });
        res.end( err?err.message:data);
    })
}

const server = http.createServer(requestListener);
server.listen(80);