var http = require('http'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    watch = require('node-watch'),
    log = require('npmlog'),
    cfg = require('./config.json');
    generateFeed = require('./feed.js');

/**
 *  TODO:
 *  Auto download stuff
 *  Use asynchronous things (really needed ? I mean stating stuff is pretty fast)
 *  Prevent watcher to get crazy when copying a big file over
 */

/* Stream part */
http.ServerResponse.prototype.stream = function(rpath) {
    var streaming_process = spawn("stream_resource.sh", [rpath]);
    streaming_process.on("error", function(error) {
        log.error("File stream", 'Streaming of resource %s returned error %j', rpath, error);
        this.writeHead(500);
        this.end();
    });
    streaming_process.stdout.pipe(this);
    streaming_process.stderr.on("data", function(data) {
        log.error("Spawned ffmpeg", data.toString());
    });
    return streaming_process;
}

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
            child = res.stream(resource);
            req.on('close', function() {
                log.info("server", "Requester hung up, killing streaming process %d", child.pid);
                child.kill("SIGHUP");
            });
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

