var http = require('http'),
    fs = require('fs'),
    rss = require('rss'),
    spawn = require('child_process').spawn,
    watch = require('node-watch'),
    log = require('npmlog'),
    cfg = require('./config.json');

/**
 *  TODO:
 *  Auto download stuff
 *  Use asynchronous things (really needed ? I mean stating stuff is pretty fast)
 *  Prevent watcher to get crazy when copying a big file over
 */

/* Stream part */
http.ServerResponse.prototype.stream = function(rpath) {
    // Using bash for free process sub
    var ffmpeg_process = spawn("stream_resource.sh", [rpath]);
    ffmpeg_process.on("error", function(error) {
        log.error("File stream", 'Streaming of resource %s returned error %j', rpath, error);
        this.writeHead(500);
        this.end();
    });
    ffmpeg_process.stdout.pipe(this);
    ffmpeg_process.stderr.on("data", function(data) {
        log.error("Spawned ffmpeg", data.toString());
    });
}

/* RSS part */
function discover(feed) {
    log.info('resource discovery', 'Starting discovery');
    log.info('resource discovery', 'Flushing items');
    feed.items = [];

    var wdir = cfg.music_folder + "/";

    var folders = fs.readdirSync(wdir).filter(function(folder) {
        return fs.statSync(wdir + folder).isDirectory();
    });

    log.info(
        'resource discovery', 'Found %d folders in %s: %j',
        folders.length, wdir, folders
    );

    for (var i = 0; i < folders.length; i += 1) {
        var folder = folders[i];

        var mtime = fs.statSync(wdir + folder).mtime

        var item = {
            title: folder,
            description: folder + ' Album',
            guid: folder,
            url: cfg.feed.feed_url + "/" + folder,
            date: mtime,
            enclosure: {
                url: cfg.feed.feed_url + "/" + folder,
            }
        }
        log.info('resource discovery', 'adding item to feed: %s', item.title);
        
        feed.item(item);
    }
    return feed.xml();
}

var feed = new rss(cfg.feed);
var xml = discover(feed);

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
            res.stream(resource);
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
    xml = discover(feed);
});

