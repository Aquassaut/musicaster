var assert = require('assert'),
    rewire = require('rewire');

var feed = rewire('../lib/feed.js');
feed.__get__('log').level = 'silent';

describe('feed', function() {
    var func
    describe('getAllChildrenOf', function() {
        before(function() {
            func = feed.__get__('getAllChildrenOf');
            feed.__set__('fs', {
                readdir: function(x, cb) {
                    if (x.indexOf("err") !== -1) return cb("error");
                    cb(null, x.split(""));
                }
            });
        });

        it('should return all children of all passed directories', function(done) {
            func(['dir'], function(err, children) {
                assert.ifError(err);
                assert.equal(children.length, 3);
                done();
            });
        });

        it('should return an empty array if not children exist', function(done) {
            func([''], function(err, children) {
                assert.ifError(err);
                assert.deepEqual(children, []);
                done();
            });
        });
    });


});
