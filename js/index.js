(function () {
    var addEvent = window.addEventListener ? 
        function (elem, evType, fn) {
            elem.addEventListener(evType, fn, false);
            return fn;
        }:
        function (elem, evType, fn) {
            elem.attachEvent('on' + evType, fn);
            return fn;
        };

    var getDefaultView = function (d) {
        return d.defaultView || d.parentWindow
    };

    var domReady = function (d, callback) {
        if (d.readyState == 'complete' || d.readyState == 'loaded') {
            setTimeout(callback, 30);
        } else {
            var done;
            var f = function () {
                if (!done) {
                    done = true;
                    callback();
                    
                }
            };
            addEvent(getDefaultView(d), 'load', f);
            addEvent(d, 'DOMContentLoaded', f);
        }
    };

    var sm2,
        iframed = window.parent != window;

    var sendMessage = function (method) {
        var data = Array.prototype.slice.call(arguments, 1);
        var msg = {
            'vkap-sm2': {
                'method': method,
                'args': data
            }
        };
        window.parent.postMessage(JSON.stringify(msg), '*');
    };

    var sm2Loaded = function (soundManager) {
        if (soundManager) {
            sm2 = soundManager;
            vkap.init();
        }
        sendMessage('sm2-loaded', !!soundManager);
    };

    var sm2opts = {
        flashVersion : 9,
        useFlashBlock : true,
        debugMode : false,
        // debugFlash: true,
        wmode : 'opaque',
        useHighPerformance : true
    };
    
    soundManager = new SoundManager('swf', false, sm2opts);
    
    soundManager.onready(function() {
        if (soundManager.supported()) {
            sm2Loaded(soundManager);
        } else {
            sm2Loaded();
    
        }
    });
    
    var doc = window.document;
    domReady(doc, function () {
        doc.body.appendChild(soundManager.getC());
        soundManager.appended();
    });

    ///////////////////////////////////////////
    ///////////////////////////////////////////
    ///////////////////////////////////////////

    var listener = function (event) {
        var data = JSON.parse(event.data);
        var fn = listenerFns[data.method];

        if (fn) {
            fn(data.args);
        }
    }

    if (window.addEventListener){
        window.addEventListener('message', listener, false);
    } else {
        window.attachEvent('onmessage', listener);
    }


    var vkap = {
        currentId: null,
        
        init: function () {
        },

        createSound: function (url) {
            vkap.currentId = url;
            
            return sm2.createSound({
                id: url,
                url: url,
                multiShot: false,
                
                onfinish: function () {
                    sendMessage('ended');
                },

                ondataerror: function () {
                    sendMessage('error');
                },

                whileplaying: function () {
                    sendMessage('whileplaying', this.position);
                },

                whileloading: function () {
                    sendMessage('whileloading', this.bytesLoaded, this.bytesTotal);
                }
            });
        },

        getSound: function () {
            if (vkap.currentId) {
                return sm2.getSoundById(vkap.currentId);
            } else {
                return null;
            }
        },
        
        setSrc: function (src) {
            var prevSound = vkap.getSound();
            if (prevSound) {
                prevSound.destruct()
            }
            vkap.createSound(src);
            sendMessage('after-set-src', src);
        },

        removeSrc: function () {
            var sound = vkap.getSound();
            if (sound) {
                sound.destruct();
                sendMessage('after-set-src', null);
            }
        },

        play: function () {
            var sound = vkap.getSound();
            if (sound) {
                sound.play();
                sendMessage('after-set-play');
            }
        },

        pause: function () {
            var sound = vkap.getSound();
            if (sound) {
                sound.pause();
                sendMessage('after-set-pause');
            }
        },

        setCurrentTime: function (val) {
            var sound = vkap.getSound();
            if (sound) {
                sound.setPosition(val * 1000);
            }
        },

        setVolume: function (val) {
            var sound = vkap.getSound();
            if (sound) {
                sound.setVolume(val);
            }
        },

        reload: function () {
            window.location.reload();
        }
    };


    var listenerFns = {
        'set-src': vkap.setSrc,
        'remove-src': vkap.removeSrc,
        'play': vkap.play,
        'pause': vkap.pause,
        'set-current-time': vkap.setCurrentTime,
        'set-volume': vkap.setVolume,
        'reload': vkap.reload
    };


})();