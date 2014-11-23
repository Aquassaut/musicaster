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
    var baseurl = "http://@@HOST@@" + (cfg.port !== 80 ? "" : (":" + cfg.port));

    var dirs = fs.readdirSync(wd).map(function(file) {
        var s = fs.statSync(path.join(wd, file));
        s.name = file;
        return s;
    }).filter(function(file) {
        return file.isDirectory();
    }).sort(function(d1, d2) {
        return d1.mtime < d2.mtime; 
    });
    log.info('resource discovery', 'Found %d dirs in %s', dirs.length, wd);

    for (var i = 0; i < dirs.length; i += 1) {
        var dir = dirs[i];
        var url = baseurl + "/" + dir.name + ".mp3";

        var item = {
            title: dir.name,
            description: dir.name + ' Album',
            guid: dir.name,
            url: url,
            date: dir.mtime,
            enclosure: {
                url: url
            }
        }
        log.info('resource discovery', 'adding item to feed: %s', item.title);
        feed.item(item);
    }
    
    return feed.xml();
}
module.exports = discover;
