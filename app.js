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
 *  Use more async calls with promises.
 *  Prevent watcher to get crazy when copying a big file over
 */

//Fix music folder setting so we accept string, but work with array
if (! util.isArray(cfg.music_folder)) {
    cfg.music_folder = [ cfg.music_folder ];
}
var xml = "generating xml...";

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
        var queried = url.parse(decodeURI(req.url).replace(/\.mp3$/g, '')).path.slice(1);
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
var regenerator = (function() {
    var _generate = function() {
        if (buildlater) {
            buildlater = false;
            build.close();
            build = setTimeout(_generate, timeout);
            return;
        }
        log.info("feed generation", "generating feed");
        generateFeed().then(function(output) { xml = output; });
        buildlater = false;
        timeout = 5000;
    }

    var build = setTimeout(_generate, 1);
    var timeout = 5000;
    var buildlater = false;

    return function(filename) {
        if (buildlater) {
            return;
        } else if (build._idleNext !== null) {
            //build already queued
            log.info('watcher', 'Quick changes detected in filesystem, waiting before taking action');
            timeout *= 2;
            buildlater = true;
        } else {
            log.info('watcher', '%s changed on disk, queuing RSS regeneration', filename);
        }
        build.close();
        build = setTimeout(_generate, timeout);
    };
})();

watch(cfg.music_folder, { followSymLinks:true, maxSymLevel:10 }, regenerator);

