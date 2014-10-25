var log = require('npmlog'),
    util = require('util'),
    path = require('path'),
    tmp = require('temp'),
    fs = require('fs'),
    ffmpeg = require('fluent-ffmpeg'),
    buffer = require ('buffer');

function streamDirectoryContent(directory, output) {
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
            _createAudioStream(inputfile.path, output);
        });
    });
}

function _createAudioStream(input, output) {
    var cmd = ffmpeg(input);
    cmd.inputFormat('concat')
        .outputFormat('mp3')
        .audioCodec('copy');
    cmd.on('start', function(line) {
        log.info('ffmpeg command', line);
    });
    cmd.on('end', function() {
        log.info('ffmpeg', 'stream ended - cleaning temporary file %s', input);
        //clean temp file
        fs.unlink(input, function(err) {
            if (err) log.error('temporary file cleaning', err.message);
        });
    })
    cmd.on('error', function(err) {
        log.info('ffmpeg error', err.message);
        output.writeHead(500);
        output.end();
    });
    cmd.pipe(output);
}

module.exports = streamDirectoryContent;
