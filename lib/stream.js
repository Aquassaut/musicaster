var log = require('npmlog'),
    util = require('util'),
    path = require('path'),
    tmp = require('temp'),
    fs = require('fs'),
    ffmpeg = require('fluent-ffmpeg'),
    buffer = require ('buffer'),
    formats = require('./mimetypes.json');

function _makeScriptFileContent(directory, files) {
    var content = [];
    files = files.sort();
    for (var i = 0; i < files.length; i += 1) {
        file = files[i];
        var fpath = path.join(directory, file).replace(/'/g, "'\\''");
        content.push(util.format("file '%s'", fpath));
    }
    return content.join('\n');
}

function _createTempFile(content, cb) {
    var inputfile = tmp.createWriteStream();
    inputfile.end(content, 'utf8', function() {
        return cb(inputfile);
    });
}

function _deleteTempFile(file) {
    fs.unlink(file, function(err) {
        if (err) log.error('temporary file cleaning', err.message);
    });
}


function _createAudioStream(input, format, res) {
    var cmd = ffmpeg({source: input, logger: log});
    var tmpstream = null;
    var ended = false;
    cmd.inputFormat('concat')
        .outputFormat(format.name)
        .audioCodec('copy');
    cmd.on('start', function(line) {
        log.info('ffmpeg command', line);
    });
    cmd.on('end', function() {
        ended = true;
        log.info('ffmpeg', 'stream ended - cleaning temporary file %s', input);
    });
    cmd.on('error', function(err) {
        log.error('ffmpeg error', err.message);
        if (!res.headersSent) {
            // Maybe we've got a chance to alert the caller by sending a 500
            res.writeHead(500);
            res.end();
            res.emit('sendStarted');
        }
        _deleteTempFile(input);
    });
    cmd.on('codecData', function(data) {
        log.info("ffmpeg command", "command passed, piping output");
        res.writeHead(200, { 'Content-Type': format.mimetype });
        tmpstream.pipe(res);
        res.emit('sendStarted');
        _deleteTempFile(input);
    });
    tmpstream = cmd.pipe();
    res.on('close', function() {
        log.info("ffmpeg", "Connection closed by client, killing ffmpeg");
        if (!ended) { cmd.kill(); }
    });
}

function _get_format_from_file_list(files) {
    var mapping = [];
    var i;
    for (i = 0; i < formats.length; i += 1) {
        mapping[i] = 0;
    }

    files.map(function(file) {
        for (i = 0; i < formats.length; i += 1) {
            if (!!file.match(new RegExp(formats[i].extension))) {
                log.info("matcher", "file " + file + " is " + formats[i].name);
                mapping[i] += 1;
                break;
            }
        }
    });

    var largest = 0;
    for (i = 0; i < mapping.length; i += 1) {
        if (mapping[i] > mapping[largest]) {
            largest = i;
        }
    }

    return formats[largest];
}

function streamDirectoryContent(directory, res) {
    fs.readdir(directory, function(err, files) {
        if (err) {
            log.error("readdir", err.message);
            return;
        }
        var format = _get_format_from_file_list(files);
        log.info("format guesser", "guessed that the content of dir " + directory + " is " + format.name);

        files = files.filter(function(file) {
            return !!file.match(new RegExp(format.extension));
        });

        if (files.length === 0) {
            //empty dir ? 204 No-content
            res.writeHead(204);
            res.end();
            res.emit('sendStarted');
            return;
        }
        var content = _makeScriptFileContent(directory, files);
        _createTempFile(content, function(file) {
            _createAudioStream(file.path, format, res);
        });
    });
}

module.exports = streamDirectoryContent;

