var http = require('http');
    fs = require('fs'),
    rss = require('rss'),
    watch = require('node-watch'),
    log = require('npmlog-ts');

log.timestamp = true;

/**
 *  TODO:
 *  Make sure there's a auto mp3wrap
 *  auto download stuff
 */

/* The RSS feed */
var feed = new rss({
    title: 'Aqua\'s playlist',
    description: 'My playlist yo',
    feed_url: 'http://aquassaut.pwnz.org:3333',
    site_url: 'http://aquassaut.pwnz.org:3333',
});

function discover(feed) {
    log.info('resource discovery', 'Starting discovery');
    log.info('resource discovery', 'Flushing items');
    feed.items = [];

    var folders = fs.readdirSync("./music").filter(function(folder) {
        return fs.statSync("./music/" + folder).isDirectory() && fs.existsSync("./music/" + folder + "/output_MP3WRAP.mp3");
    });

    log.info('resource discovery', 'Found %d folders in ./music: %j', folders.length, folders);

    for (var i = 0; i < folders.length; i += 1) {
        var folder = folders[i];

        var file = "./music/" + folder + "/output_MP3WRAP.mp3";
        var mtime = fs.statSync(file).mtime

        var item = {
            title: folder,
            description: (folder + ' Album'),
            guid: folder,
            url: ('http://aquassaut.pwnz.org:3333/' + folder),
            date: mtime,
            enclosure: {
                url: ('http://aquassaut.pwnz.org:3333/' + folder),
                file:'./music/' + folder + '/output_MP3WRAP.mp3'
            }
        }
        log.info('resource discovery', 'adding item to feed: %s', item.title);
        
        feed.item(item);
    }
    return feed.xml();
}
var xml = discover(feed);


/* Server part */
http.createServer(function (req, res) {
    if (req.url === "/") {
        res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
        res.end(xml);
    } else {
        var resource = req.url.slice(1 + req.url.lastIndexOf("/"));
        var rdir = "./music/" + resource;
        var rpath = rdir + "/output_MP3WRAP.mp3";
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
    debugger;
    log.info('server', '[%s] %s %s (%d)', req.connection.remoteAddress, req.method, req.url, res.statusCode);

}).listen(3333, function() {
    log.info('server', 'Server listening on port 3333');
});

/* Directory watcher part */
watch('./music', function(filename) {
    log.info('watcher', '%s changed on disk, rebuilding feed', filename);
    xml = discover(feed);
});



