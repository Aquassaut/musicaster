var http = require('http'),
    fs = require('fs'),
    watch = require('node-watch'),
    log = require('npmlog'),
    cfg = require('./config.json');
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
    if (req.url === "/") {
        res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
        res.end(xml);
    } else {
        var resource = cfg.music_folder + "/" + req.url.slice(1 + req.url.lastIndexOf("/"));
        if (fs.existsSync(resource)) {
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
            });
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

