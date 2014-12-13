var rss = require('rss'),
    fs = require('fs'),
    url = require('url'),
    log = require('npmlog'),
    path = require('path');

var _parallelize = function(operation, ary, register, cb) {
    var remaining = ary.length;
    var allResults = [];
    var done = function() {
        remaining -= 1;
        if (remaining === 0) {
            cb(null, allResults);
        }
    };
    for (var i = 0; i < ary.length; i += 1) {
        var item = ary[i];
        registerItem = register(item, allResults, done)
        operation(item, registerItem);
    }
};

var getAllChildrenOf = function(folders, cb) {
    _parallelize(fs.readdir, folders, function(folder, allChildren, done) {
        return function _register(err, children) {
            if (err) return cb(err);
            for (var j = 0; j < children.length; j += 1) {
                var file = children[j];
                allChildren.push(path.join(folder, file));
            }
            done();
        };
    }, cb);
}

var statAll = function(files, cb) {
    _parallelize(fs.stat, files, function(file, allStats, done) {
        return function _register(err, stat) {
            if (err) return cb(err);
            stat.name = path.basename(file);
            allStats.push(stat);
            done();
        };
    }, cb);
};

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
        var url = baseurl + "/" + dir.name + ".mp3";

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

    getAllChildrenOf(folders, function(err, children) {
        if (err) return callback(err);
        statAll(children, function(err, stats) {
            if (err) return callback(err);
            var dirs = stats.filter(directories_only).sort(by_mtime);
            callback(null, createRssFeed(dirs, port, feedinfo));
        });
    });
};

exports.generate = generate;
