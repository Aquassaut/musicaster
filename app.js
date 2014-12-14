var log = require('npmlog'),
    cfg = require('./config.json'),
    server = require('./lib/server.js'),
    watcher = require('./lib/watcher.js'),
    feed = require('./lib/feed.js');

/**
 *  TODO:
 *  Use more async calls
 */

var xml = "generating xml...";
var folders = cfg.music_folder || ".";
var port = cfg.port || 3333;
var feedinfo = cfg.feed || {
    "title": "Feed Title",
    "description": "A great feed",
    "feed_url": "127.0.0.1",
    "site_url": "127.0.0.1"
};
var url = feedinfo.feed_url || "127.0.0.1";

var webserver = server.startServer(xml, folders, port, url);
watcher.startWatching(folders, function() {
    feed.generate(folders, port, feedinfo, function(err, xml) {
        if (err)  return log.error(err);
        webserver.reloadXml(xml);
    });
});


