var rss = require('rss'),
    fs = require('fs'),
    url = require('url'),
    log = require('npmlog'),
    path = require('path'),
    cfg = require('./config.json');

var feed = new rss(cfg.feed);

function discover() {
    log.info('resource discovery', 'Starting discovery');
    log.info('resource discovery', 'Flushing items');
    feed.items = [];

    var wd = cfg.music_folder;

    var dirs = fs.readdirSync(wd).filter(function(file) {
        return fs.statSync(path.join(wd, file)).isDirectory();
    });

    log.info(
        'resource discovery', 'Found %d dirs in %s: %j',
        dirs.length, wd, dirs
    );

    for (var i = 0; i < dirs.length; i += 1) {
        var dir = dirs[i];

        var mtime = fs.statSync(path.join(wd, dir)).mtime

        var item = {
            title: dir,
            description: dir + ' Album',
            guid: dir,
            url: url.resolve(cfg.feed.feed_url,  dir),
            date: mtime,
            enclosure: {
                url: url.resolve(cfg.feed.feed_url,  dir)
            }
        }
        log.info('resource discovery', 'adding item to feed: %s', item.title);

        feed.item(item);
    }
    return feed.xml();
}
module.exports = discover;


