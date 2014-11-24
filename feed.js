var rss = require('rss'),
    fs = require('fs'),
    url = require('url'),
    log = require('npmlog'),
    Q = require('q'),
    path = require('path'),
    cfg = require('./config.json');


function getStatsFromFile(file) {
    var stat = Q.denodeify(fs.stat);
    return stat(file).then(function(s) {
        s.name = path.basename(file);
        return s;
    });
}
function getFilesFromDir(wd) {
    var readdir = Q.denodeify(fs.readdir);
    return readdir(wd).then(function(content) {
        return content.map(function(file) {
            return path.join(wd, file);
        });
    });
}
function getStatsFromDirs(wds) {
    return Q.all(wds.map(function(elem) {
        return getFilesFromDir(elem).then(function(files) {
            return Q.all(files.map(getStatsFromFile));
        });
    }));
}
function discover() {
    var deferred = Q.defer();

    log.info('resource discovery', 'Starting discovery');
    
    var wds = cfg.music_folder;
    var baseurl = "http://@@HOST@@" + (cfg.port !== 80 ? "" : (":" + cfg.port));

    getStatsFromDirs(wds).then(function(nestedArrays) {
        return nestedArrays.reduce(function(a, b) {
            return a.concat(b);
        });
    }).then(function(dirs) {
        return dirs.filter(function(file) {
            return file.isDirectory();
        })
    }).then(function(dirs) {
        return dirs.sort(function(d1, d2) {
            return d1.mtime < d2.mtime; 
        });
    }).then(function(dirs) {
        var feed = new rss(cfg.feed);
        log.info('resource discovery', 'Found %d dirs in music dirs', dirs.length);

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
        deferred.resolve(feed.xml());
    });
    return deferred.promise;
}

module.exports = discover;
