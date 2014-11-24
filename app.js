var http = require('http'),
    fs = require('fs'),
    watch = require('node-watch'),
    path = require('path'),
    util = require('util'),
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

//Fix music folder setting so we accept string, but work with array
if (! util.isArray(cfg.music_folder)) {
    cfg.music_folder = [ cfg.music_folder ];
}
var xml = "generating xml...";
generateFeed().then(function(output) { xml = output; });

/* Server part */
http.createServer(function (req, res) {
    res.on('sendStarted', function() {
        log.info(
            'server', '[%s] %s %s (%d)',
            req.connection.remoteAddress, req.method, req.url, res.statusCode
        );
    });
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
        res.end(xml.replace(/@@HOST@@/g, (req.headers.host || cfg.site_url)));
        res.emit('sendStarted');
    } else {
        var queried = url.parse(req.url.replace(/\.mp3$/g, '')).path.slice(1);
        var found = false;
        cfg.music_folder.forEach(function(folder, idx, ary) {
            if (found) return;
            log.info('matcher', 'Trying to find %s in %s', queried, folder);
            var isLastFolder = (idx === ary.length - 1);
            var directory = path.resolve(folder, queried);
            if (fs.existsSync(directory)) {
                found = true;
                streamDirectoryContent(directory, res);
            } else if (isLastFolder) {
                res.writeHead(404);
                res.end();
                res.emit('sendStarted');
            }
        });
    }
}).listen(cfg.port, function() {
    log.info('server', 'Server listening on port %d', cfg.port);
});

/* Directory watcher part */
watch(cfg.music_folder, {
    followSymLinks: true,
    maxSymLevel: 10
}, function(filename) {
    log.info('watcher', '%s changed on disk, rebuilding feed', filename);
    generateFeed().then(function(output) { xml = output; });
    //xml = generateFeed();
});

