var rss = require('rss'),
    log = require('npmlog'),
    formats = require('./formats.js'),
    utls = require('./utils.js');


// Sort function
var by_mtime = function(d1, d2) {
    return d2.mtime.getTime() - d1.mtime.getTime(); 
};

// Filter function
var directories_only = function(file) {
    return file.isDirectory();
};

var createRssFeed = function(dirs, port, feedinfo) {
    log.info('feed', 'Found %d dirs in music dirs', dirs.length);
    var baseurl = "http://@@HOST@@" + (port !== 80 ? "" : (":" + port));
    var feed = new rss(feedinfo);

    for (var i = 0; i < dirs.length; i += 1) {
        var dir = dirs[i];
        var format = formats.guessExtensionFromDirectorySync(dir.fullpath);
        var url = baseurl + "/" + encodeURIComponent(dir.name) + '.' + format;

        var item = {
            title: dir.name,
            description: dir.name + ' Album',
            guid: dir.name,
            url: url,
            date: dir.mtime,
            enclosure: { url: url }
        };
        log.info('feed', 'adding item to feed: %s', item.title);
        feed.item(item);
    }
    log.info('feed', 'Discovery over, calling back');
    return feed.xml();
};

var generate = function(folders, port, feedinfo, callback) {
    log.info('feed', 'Starting discovery');
    if (typeof folders === 'string') folders = [folders];

    utls.getAllChildrenOf(folders, function(err, children) {
        if (err) return callback(err);
        utls.statAll(children, function(err, stats) {
            if (err) return callback(err);
            var dirs = stats.filter(directories_only).sort(by_mtime);
            callback(null, createRssFeed(dirs, port, feedinfo));
        });
    });
};

exports.generate = generate;
