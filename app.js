var http = require('http'),
    fs = require('fs'),
    rss = require('rss'),
    watch = require('node-watch'),
    log = require('npmlog-ts'),
    cfg = require('./config.json');
log.timestamp = true;

/**
 *  TODO:
 *  Make sure there's a auto mp3wrap
 *  Auto download stuff
 *  Use asynchronous things (really needed ? I mean stating stuff is pretty fast)
 */

/* RSS part */
function discover(feed) {
    log.info('resource discovery', 'Starting discovery');
    log.info('resource discovery', 'Flushing items');
    feed.items = [];

    var wdir = cfg.music_folder + "/";
    var fname = "/" + cfg.episode_name;

    var folders = fs.readdirSync(wdir).filter(function(folder) {
        return fs.statSync(wdir + folder).isDirectory() &&
               fs.existsSync(wdir + folder + fname);
    });

    log.info(
        'resource discovery', 'Found %d folders in %s: %j',
        folders.length, wdir, folders
    );

    for (var i = 0; i < folders.length; i += 1) {
        var folder = folders[i];

        var file = wdir + folder + fname;
        var mtime = fs.statSync(file).mtime

        var item = {
            title: folder,
            description: folder + ' Album',
            guid: folder,
            url: cfg.feed.feed_url + folder,
            date: mtime,
            enclosure: {
                url: cfg.feed.feed_url + folder,
                file: file
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
        var resource = req.url.slice(1 + req.url.lastIndexOf("/"));
        var rdir = cfg.music_folder + "/" + resource;
        var rpath = rdir + "/" + cfg.episode_name;
        var rsize = fs.statSync(rpath).size
        if (fs.existsSync(rdir) && fs.existsSync(rdir)) {
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': rsize
            });
            fs.createReadStream(rpath).pipe(res);
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

