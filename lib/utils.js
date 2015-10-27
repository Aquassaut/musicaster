var fs = require('fs'),
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
        var registerItem = register(item, allResults, done);
        operation(item, registerItem);
    }
};

var getAllChildrenOf = function(folders, cb) {
    _parallelize(fs.readdir, folders, function(folder, allChildren, done) {
        return function _register(err, children) {
            if (err) {
                log.error("feed", err);
                return done();
            }
            for (var j = 0; j < children.length; j += 1) {
                var file = children[j];
                allChildren.push(path.join(folder, file));
            }
            done();
        };
    }, cb);
};

var statAll = function(files, cb) {
    _parallelize(fs.stat, files, function(file, allStats, done) {
        return function _register(err, stat) {
            if (err) {
                log.error("feed", err);
                return done();
            }
            stat.name = path.basename(file);
            stat.fullpath = file;
            allStats.push(stat);
            done();
        };
    }, cb);
};

var readAllFilesFromDir = function(root, recurse, callback) {
    fs.readdir(root, function(err, files) {
        if (err) return callback(err);

        files = files.map(function(f) {
            return root + "/" + f;
        });

        statAll(files, function(err, stats) {
            if (err) return callback(err);

            var files_list = stats.filter(function(s) {
                return s.isFile();
            }).map(function(s) {
                return s.fullpath;
            });
            var dirs_list = stats.filter(function(s) {
                return s.isDirectory();
            }).map(function(s) {
                return s.fullpath;
            });

            if ((! recurse) || (dirs_list.length === 0)) {
                return callback(null, files_list);
            }

            var parall_read = function(dir, cb) {
                return readAllFilesFromDir(dir, true, cb);
            };

            _parallelize(parall_read, dirs_list, function(dir, all_files, done) {
                return function _register(err, files) {
                    if (err) callback(err);
                    for (var i = 0; i < files.length; i += 1) {
                        all_files.push(files[i]);
                    }
                    done();
                };
            }, function(err, all_subdirs_files) {
                if (err) return callback(err);
                return callback(null, files_list.concat(all_subdirs_files));
            });

        });

    });
};

module.exports = {
    getAllChildrenOf: getAllChildrenOf,
    statAll: statAll,
    readAllFilesFromDir: readAllFilesFromDir
};
