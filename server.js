const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port, (err) => {
    if (err) {
        console.log('something bad happened', err);
    }

    console.log('server is up and listening on '+port);
});

