var assert = require('assert'),
    rewire = require('rewire');

var server = rewire('../lib/server.js');
server.__get__('log').level = 'silent';

describe("server", function() {
    var func;
    describe('_getResourceFromPath', function() {

        var func = server.__get__('_getResourceFromPath');
        it('should not return the file extension', function() {
            assert.equal(func('resource.mp3'), 'resource');
        });

        it('should not return the leading slash', function() {
            assert.equal(func('/resource'), 'resource');

        });

        it('should un-percent encode resources', function() {
            assert.equal(func('a%20b%20c'), 'a b c');
        });
    });
    describe('_findResourceFullPath', function() {
        before(function() {
            func = server.__get__('_findResourceFullPath');
            var mockFs = {
                existsSync: function( path ) {
                    return path.indexOf('existing') !== -1;
                }
            };
            server.__set__('fs', mockFs);
            return func;
        });

        it('should handle a directory or an array of directories', function() {
            assert.equal(func('/existing/dir', 'ection'), '/existing/dir/ection');
            assert.equal(func(['/existing/dir'], 'ection'), '/existing/dir/ection');
        });

        it('should return null if the resource does not exist', function() {
            assert.equal(func('/non/existant/dir', 'a resource'), null);
        });

        it('should return the first result', function() {
            assert.equal(func(['/existing', '/also/existing'], 'res'), '/existing/res');
        });

    });
});