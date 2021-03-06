var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    log = require('npmlog'),
    entities = new (require('html-entities').XmlEntities)(),
    streamDirectoryContent = require('./stream.js');

var _getResourceFromPath = function(path) {
    var decoded = entities.decode(decodeURIComponent(path)); //cleaning
    var trimmedRight = decoded.slice(0, decoded.lastIndexOf('.')); // Very naive way of cutting the extension and possible trailing slash out. We'll see how it holds
    var trimmedLeft = trimmedRight.replace(/^\//g, ''); //removing leading slash
    log.silly("Resource matcher", "matched resource %s from path %s", trimmedLeft, path);
    return trimmedLeft;
};

var _findResourceFullPath = function(dirs, resource) {
    if (typeof dirs === 'string') dirs = [dirs];
    for (var i = 0; i < dirs.length; i+= 1) {
        var dir = dirs[i];
        log.info('server', 'Trying to find %s in %s', resource, dir);
        var fullpath = path.resolve(dir, resource);
        if (fs.existsSync(fullpath)) return fullpath;
    }
    return null;
};

var startServer = function(xml, folders, port, url) {
    var server = http.createServer(function (req, res) {
        res.on('sendStarted', function() {
            log.info(
                'server', '[%s] %s %s (%d)',
                req.connection.remoteAddress, req.method, req.url, res.statusCode
            );
        });
        if (req.url === '/') {
            res.writeHead(200, {'Content-Type': 'text/xml; charset=UTF-8'});
            res.end(xml.replace(/@@HOST@@/g, (req.headers.host || url)));
            return res.emit('sendStarted');
        } else {
            var resource = _getResourceFromPath(req.url);
            var fullpath = _findResourceFullPath(folders, resource);

            if (fullpath === null) {
                res.writeHead(404);
                res.end();
                return res.emit('sendStarted');
            }
            return streamDirectoryContent(fullpath, res);
        }
    }).listen(port, function() {
        log.info('server', 'Server listening on port %d', port);
    });
    server.reloadXml = function(new_xml) {
        log.info('server', 'Received new XML');
        xml = new_xml;
    };
    return server;
};

exports.startServer = startServer;
