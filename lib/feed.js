var rss = require('rss'),
    fs = require('fs'),
    url = require('url'),
    log = require('npmlog'),
    Q = require('q'),
    path = require('path');


function getStatsFromFile(file) {
    log.silly('feed', 'getting stats from file %s', file);
    var stat = Q.denodeify(fs.stat);
    return stat(file).then(function(s) {
        s.name = path.basename(file);
        return s;
    });
}
function getFilesFromDir(wd) {
    log.silly('feed', 'getting files from dir %s', wd);
    var readdir = Q.denodeify(fs.readdir);
    return readdir(wd).then(function(content) {
        return content.map(function(file) {
            return path.join(wd, file);
        });
    });
}
function getStatsFromDirs(folders) {
    log.silly('feed', 'getting all stats in dirs %j', folders);
    return Q.all(folders.map(function(elem) {
        return getFilesFromDir(elem).then(function(files) {
            return Q.all(files.map(getStatsFromFile));
        });
    }));
}

var generate = function(folders, port, feedinfo, callback) {
    log.info('feed', 'Starting discovery');

    if (typeof folders === 'string') folders = [folders];
    
    var baseurl = "http://@@HOST@@" + (port !== 80 ? "" : (":" + port));

    getStatsFromDirs(folders).then(function(nestedArrays) {
        log.info('feed', 'Un-nesting array');
        return nestedArrays.reduce(function(a, b) {
            return a.concat(b);
        });
    }).then(function(dirs) {
        log.silly('feed', 'Filtering out non directories');
        return dirs.filter(function(file) {
            return file.isDirectory();
        });
    }).then(function(dirs) {
        log.silly('feed', 'sorting dirs by mtime');
        var nb = 0;
        return dirs.sort(function(d1, d2) {
            log.silly('feed', '%d comparision', ++nb );
            return d2.mtime.getTime() - d1.mtime.getTime(); 
        });
    }).then(function(dirs) {
        log.info('feed', 'Found %d dirs in music dirs', dirs.length);
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
                enclosure: {
                    url: url
                }
            };
            log.info('feed', 'adding item to feed: %s', item.title);
            feed.item(item);
        }
        log.info('feed', 'Discovery over, calling back');
        callback(null, feed.xml());
    });
};

exports.generate = generate;
