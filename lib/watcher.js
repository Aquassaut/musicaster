var watch = require('node-watch'),
    log = require('npmlog');
var regenerator = function(cb) {
    var _generate = function() {
        if (buildlater) {
            buildlater = false;
            build.close();
            build = setTimeout(_generate, timeout);
            return;
        }
        buildlater = false;
        timeout = 5000;
        log.info("watcher", "building");
        cb();
    };

    var build = setTimeout(_generate, 1);
    var timeout = 5000;
    var buildlater = false;

    return function(filename) {
        if (buildlater) {
            return;
        } else if (build._idleNext !== null) {
            //build already queued
            log.info('watcher', 'Quick changes detected in filesystem, waiting before taking action');
            timeout *= 2;
            buildlater = true;
        } else {
            log.info('watcher', '%s changed on disk, queuing RSS regeneration', filename);
        }
        build.close();
        build = setTimeout(_generate, timeout);
    };
};

var startWatching = function(folders, cb) {
    var opts = { followSymLinks:true, maxSymLevel:10 };
    watch(folders, opts, regenerator(cb));
};

exports.startWatching = startWatching;
