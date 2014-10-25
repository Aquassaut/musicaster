var log = require('npmlog'),
    util = require('util'),
    path = require('path'),
    tmp = require('temp'),
    fs = require('fs'),
    ffmpeg = require('fluent-ffmpeg'),
    buffer = require ('buffer');

function deleteTempFile(file) {
    fs.unlink(file, function(err) {
        if (err) log.error('temporary file cleaning', err.message);
    });
}

function streamDirectoryContent(directory, res) {
    fs.readdir(directory, function(err, files) {
        if (err) {
            log.error("readdir", err.message);
            return;
        }
        
        var inputfile = tmp.createWriteStream();

        inputfile.end(files.filter(function(file) {
            return !!file.match(/\.mp3$/);
        }).sort().reduce(function(acc, file) {
            var fpath = path.join(directory, file).replace("'", "\\'");
            line = util.format("file '%s'", fpath);
            return acc + line + '\n';
        }, ''), 'utf8', function() {
            _createAudioStream(inputfile.path, res);
        });
    });
}

function _createAudioStream(input, res) {
    var cmd = ffmpeg(input);
    var tmpstream = null;
    cmd.inputFormat('concat')
        .outputFormat('mp3')
        .audioCodec('copy');
    cmd.on('start', function(line) {
        log.info('ffmpeg command', line);
    });
    cmd.on('end', function() {
        log.info('ffmpeg', 'stream ended - cleaning temporary file %s', input);
    });
    cmd.on('error', function(err) {
        log.error('ffmpeg error', err.message);
        if (!res._header) {
            // Maybe we've got a chance to alert the caller by sending a 500
            res.writeHead(500);
            res.end();
        }
        deleteTempFile(input);
    });
    cmd.on('codecData', function(data) {
        log.info("ffmpeg command", "command passed, piping output");
        output.writeHead(200, { 'Content-Type': 'audio/mpeg' });
        tmpstream.pipe(res);
        deleteTempFile(input);
    });
    tmpstream = cmd.pipe();
}

module.exports = streamDirectoryContent;
