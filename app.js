var http = require('http'),
    fs = require('fs'),
    watch = require('node-watch'),
    path = require('path'),
    log = require('npmlog'),
    url = require('url'),
    cfg = require('./config.json'),
    streamDirectoryContent = require('./stream.js'),
    generateFeed = require('./feed.js');

/**
 *  TODO:
 *  Auto download stuff
 *  Use asynchronous things (really needed ? I mean stating stuff is pretty fast)
 *  Prevent watcher to get crazy when copying a big file over
 */
var xml = generateFeed();

/* Server part */
http.createServer(function (req, res) {
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
        res.end(xml);
    } else {
        var queried = url.parse(req.url).path.slice(1);
        var directory = path.resolve(cfg.music_folder, queried);
        log.info("debug", directory);
        if (fs.existsSync(directory)) {
            streamDirectoryContent(directory, res);
        } else {
            res.writeHead(404);
            res.end();
        }
    }
    log.info(
        'server', '[%s] %s %s (%d)',
        req.connection.remoteAddress, req.method, req.url, res.statusCode
    );
}).listen(cfg.port, function() {
    log.info('server', 'Server listening on port %d', cfg.port);
});

/* Directory watcher part */
watch(cfg.music_folder, function(filename) {
    log.info('watcher', '%s changed on disk, rebuilding feed', filename);
    xml = generateFeed()
});

