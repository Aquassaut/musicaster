var formats = require('./formats.json'),
    log = require('npmlog'),
    fs = require('fs');

var guessFormatFromFileList = function(files) {
    var mapping = [];
    var i;
    for (i = 0; i < formats.length; i += 1) {
        mapping[i] = 0;
    }

    files.map(function(file) {
        for (i = 0; i < formats.length; i += 1) {
            if (!!file.match(new RegExp(formats[i].extension))) {
                log.silly("format guesser", "file " + file + " is " + formats[i].name);
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

    var format = formats[largest];

    log.info("format guesser", "guessed that the format  is " + format.name);
    return format;
};

var guessExtensionFromDirectorySync = function(dir) {
    return guessFormatFromFileList(fs.readdirSync(dir)).name;
};

module.exports = {
    guessExtensionFromDirectorySync: guessExtensionFromDirectorySync,
    guessFormatFromFileList: guessFormatFromFileList
};
