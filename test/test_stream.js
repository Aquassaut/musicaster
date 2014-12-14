var assert = require('assert'),
    rewire = require('rewire');

var stream = rewire('../lib/stream.js');


describe('stream', function() {
    var func;
    describe('_makeScriptFileContent', function() {
        before(function() {
            func = stream.__get__('_makeScriptFileContent');
        });
        it('creates as many lines as there are files', function() {
            assert.equal(func('dir', ['a', 'b', 'c']).split('\n').length, 3);
        });
        it('wraps all file paths in between "File \'" and "\'" ', function() {
            assert.equal(func('full', ['path']), "file 'full/path'");
        });
        it('closes, escapes and reopen apostrophes to escape them', function() {
            assert.equal(func('dir', ["a'b'c"]), "file 'dir/a'\\''b'\\''c'");
        });
    });


});