/*
 * modified starting from:
 * http://famousco.de/2014/07/surface-ontap-convenience-hack/
 * https://gist.github.com/markmarijnissen/b6b980f6f3503cc1ab75
 * https://gist.github.com/markmarijnissen
*/

define(function(require, exports, module) {
    var Surface = require('famous/core/Surface');

    var setListener = function(surface, events, callback) {
        var eventsArray = events.split(' '),
            i = eventsArray.length;
        while (i--) {
            surface.on(eventsArray[i], callback);
        }
    };

    function addTapEvent(surface) {
        var tapEvent = null,
            fireTap = function() {
                tapEvent.surface = surface;
                surface.emit('tap', tapEvent);
                //console.log('TAP');
            };

        //setting the events listeners
        setListener(surface, 'touchstart mousedown', function(e) {
            e.preventDefault();
            tapEvent = e;
            fireTap();
        });
    }

    var _surfaceOn = Surface.prototype.on;
    Surface.prototype.on = function on(type, fn) {
        if (type == "tap" && !this.tapEnabled) {
            addTapEvent(this);
            this.tapEnabled = true;
        }
        _surfaceOn.call(this, type, fn);
    };
});