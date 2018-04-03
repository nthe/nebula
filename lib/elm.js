(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/**
 * Grranular synthesizer. 
 * 
 * @description Granular synthesizer.
 * @author Juraj Onuska
 * @e-mail: jurajonuska@gmail.com
 */

const Synth    = require('./synth/synth');
const KeyBoard = require('./keyboard/keyboard');
const Circle   = require('./circle/circle');
const Label    = require('./label/label');
const Scope    = require('./scope/scope');
const Slider   = require('./slider/slider');
const WaveForm = require('./waveform/waveform');
const XYPad    = require('./xypad/xypad');
const Utils    = require('./utils/utils');

const lib = {
    Synth:          Synth,
    KeyBoard:       KeyBoard,
    GUI: {
        Circle:     Circle,
        Label:      Label,
        Scope:      Scope,
        Slider:     Slider,
        WaveForm:   WaveForm,
        XYPad:      XYPad
    },
    Utils:          Utils
};

// console.log(lib);
// window.ELM = lib;
module.exports.ELM = lib;
// export default lib;
},{"./circle/circle":1,"./keyboard/keyboard":3,"./label/label":4,"./scope/scope":5,"./slider/slider":6,"./synth/synth":7,"./utils/utils":8,"./waveform/waveform":9,"./xypad/xypad":10}],3:[function(require,module,exports){
// const keyboard = (function (global) {
"use strict";
let global = window;

/**
 * Map between keys and notes.
 */
const keyToNoteMap = {
    'a': { note: 'C',   freq: 16.35 },
    'w': { note: 'C#',  freq: 17.32 },
    's': { note: 'D',   freq: 18.35 },
    'e': { note: 'D#',  freq: 19.45 },
    'd': { note: 'E',   freq: 20.60 },
    'f': { note: 'F',   freq: 21.83 },
    't': { note: 'F#',  freq: 23.12 },
    'g': { note: 'G',   freq: 24.50 },
    'y': { note: 'G#',  freq: 25.96 },
    'h': { note: 'A',   freq: 27.50 },
    'u': { note: 'A#',  freq: 29.14 },
    'j': { note: 'B',   freq: 30.87 },
    'k': { note: 'C',   freq: 32.70 },
    'o': { note: 'C#',  freq: 34.65 },
    'l': { note: 'D',   freq: 36.71 },
    'p': { note: 'D#',  freq: 38.89 },
};

/** 
 * Map between keys and commands.
*/
const keyToCommandsMap = {
    'z': 'octave-down',
    'x': 'octave-up',
    'c': 'velocity-down',
    'v': 'velocity-up',
    'b': 'hold-mode'
}

/**
 * Limit number to certain range.
 * @param {number} num input number
 * @param {number} min lower limit
 * @param {number} max upper limit
 * @returns {number} number
 */
const limitTo = (num, min, max) => Math.min(Math.max(num, min), max);


/**
 * Wrapper for function consturctor.
 * @function KeyBoard
 * @constructor
 * @constructs KeyBoard.init
 * @param {number} octave initial octave
 * @param {number} velocity initial velocity
 * @returns {KeyBoard.init} instance
 */
const KeyBoard = (octave, velocity) => new KeyBoard.init(octave, velocity);

/**
 * @constructor
 * @constructs KeyBoard.init
 * @description function constructor
 * @param {number} octave initial octave
 * @param {number} velocity initial velocity
 * @returns {KeyBoard.init} self
 */
KeyBoard.init = function (octave = 1, velocity = 100) {
    this.octave = octave;
    this.velocity = velocity;
    this.holdMode = false;
    this.heldKeys = {};
    this.subscribers = [];
    this.activate();
};

KeyBoard.prototype = {
    
    /**
     * @method subscribe
     * @description register callback for subscription
     * @param {function} callback callback method
     * @returns {KeyBoard} this
     */
    subscribe: function (callback) {
        if(!this.subscribers.indexOf(callback) < 0) {
            return;
        }
        callback.update(this.value);
        this.subscribers.push(callback);
        return this;
    },

    /**
     * @method unsubscribe
     * @description un-register callback from subscription
     * @param {function} callback callback method
     * @returns {KeyBoard} this
     */
    unsubscribe: function (callback) {
        let position = this.subscribers.indexOf(callback);
        if (position < 0) {
            return;
        }
        this.subscribers.splice(position, 1);
        return this;
    },

    /**
     * @method emit
     * @description calls callbacks of subscribers
     * @param {any} data data to publish
     * @returns {any} data
     */
    emit: function (data) {
        this.subscribers.map(f => f.update(data));
        return data;
    },

    /**
     * @method noteToFreq
     * @description converts note at specific octave to frequency
     * @param {object} note note object
     * @returns {number} frequency
     */
    noteToFreq: function (note) {
        return note.freq * Math.pow(2, this.octave);
    },

    /**
     * @property
     * @description number currently of active voices
     */
    activeVoices: 0,

    /**
     * @method keyHandler
     * @description handles key events
     * @param {Event} event keyboard event
     */
    keyHandler: function (event) {
        const note = keyToNoteMap[event.key];
        const command = keyToCommandsMap[event.key];
        
        if (event.type === 'keydown') {
            // check if note should be (re)triggered
            const doTrigger = !this.heldKeys.hasOwnProperty(event.key) || this.holdMode;
            
            // handle note key
            if (note && doTrigger) {
                const voice = this.activeVoices++;
                this.heldKeys[event.key] = voice;
                const msg = Object.assign({}, note, {voice: voice, freq: this.noteToFreq(note), state: 'on' });
                this.emit(msg);
                // this.emit({ ...note, voice: voice, freq: this.noteToFreq(note), state: 'on' });
            }
            
            // handle command key
            if (command) {
                let load = null;
                switch (command) {
                    case 'octave-up':
                        this.octave = limitTo(this.octave + 1, -8, 8);
                        load = { command: command, state: this.octave };
                        break;
                    case 'octave-down':
                        this.octave = limitTo(this.octave - 1, -8, 8);;
                        load = { command: command, state: this.octave };
                        break;
                    case 'velocity-up':
                        this.velocity = limitTo(this.velocity + 5, 0, 127);
                        load = { command: command, state: this.velocity };
                        break;
                    case 'velocity-down':
                        this.velocity = limitTo(this.velocity - 5, 0, 127);
                        load = { command: command, state: this.velocity };
                        break;
                    case 'hold-mode':
                        this.holdMode = !this.holdMode;
                        load = { command: command, state: this.holdMode };
                        break;
                }
                if (load) {
                    this.emit(load);
                }
            }
        }
        if (event.type === 'keyup') {
            // check if key was held and hold-mode is off
            const heldKey = this.heldKeys[event.key];
            if (typeof heldKey !== 'undefined' && !this.holdMode) {
                delete this.heldKeys[event.key];
                // this.emit({ ...note, voice: heldKey, freq: this.noteToFreq(note), state: 'off' });
                const msg = Object.assign({}, note, {voice: heldKey, freq: this.noteToFreq(note), state: 'off' });
                this.emit(msg);
                
            }
            // reset voice indexer
            if (!Object.keys(this.heldKeys).length) {
                this.activeVoices = 0;
            }
        }
    },

    /**
     * @method deactivate
     * @description disable keyboard
     * @returns {KeyBoard} this
     */
    deactivate: function () {
        global.removeEventListener('keydown', this.keyHandler.bind(this));
        global.removeEventListener('keyup',   this.keyHandler.bind(this));
        return this;
    },

    /**
     * @method activate
     * @description enable keyboard
     * @returns {KeyBoard} this
     */
    activate: function () {
        global.addEventListener('keydown', this.keyHandler.bind(this));
        global.addEventListener('keyup',   this.keyHandler.bind(this));
        return this;
    }
};

KeyBoard.init.prototype = KeyBoard.prototype;

module.exports.KeyBoard = KeyBoard;
module.exports.default  = KeyBoard;

    // global.KeyBoard = KeyBoard;

// });


// // auto-init in browser env
// if (typeof exports === 'undefined') {
//     keyboard(window);
// } 
// // manual load in node env (mock window)
// else {
//     exports.KeyBoardMock = function (window) {
//         keyboard(window);
//     } 
// }

},{}],4:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],5:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],6:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],7:[function(require,module,exports){
(function (global) {
    "use strict";

    /**
     * Return random number between min and max.
     * @function random
     * @param {number} min lower bound of random
     * @param {number} max upper bound of random
     * @returns {number} random number
     */
    const random = (min, max) => (Math.random() * (max - min)) + min;

    /**
     * Map value from one range to another.
     * @function map
     * @param {number} num input number
     * @param {number} in_min lower bound of input range
     * @param {number} in_max upper bound of input range
     * @param {number} out_min lower bound of ouput range
     * @param {number} out_max upper bound of output range
     * @returns {number} mapped input number
     */
    const map = (num, in_min, in_max, out_min, out_max) => {
        return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    };

    /**
     * @function grain
     * @description play a grain sound
     * @param {Voice} voice voice
     */
    function grain(voice) {
        if (!voice.buffer) return;
        if (voice.grains > 500) return;
        voice.grains++;
        const context = voice.context;
        const doPan = parseInt(random(0, 3), 10);
        const gain = context.createGain();
        const source = context.createBufferSource();
        source.playbackRate.setValueAtTime(source.playbackRate.value * voice.trans, context.currentTime);
        source.buffer = voice.buffer;
        gain.connect(voice.master);

        let panner;
        if (doPan === 1) {
            panner = context.createPanner();
            panner.panningModel = "equalpower";
            panner.distanceModel = "linear";
            panner.setPosition(random(voice.pan * -1, voice.pan), 0, 0);
            source.connect(panner);
            panner.connect(gain);
        } 
        else {
            source.connect(gain);
        }
        
        // (amp-compensation) amp * Math.max(0.15, 1 / voice.grains);
        const amp = (1 - voice.amp);                 
        const length = voice.attack + voice.release;
        const offset = Math.max(0, voice.offset * voice.buffer.duration);
        const randomOffset = Math.abs((Math.random() * voice.spread) - (voice.spread / 2));
        
        source.start(context.currentTime, offset + randomOffset, length);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(amp, context.currentTime + voice.attack);
        gain.gain.linearRampToValueAtTime(0, context.currentTime + length);
        source.stop(context.currentTime + length);

        setTimeout(() => {
            voice.grains--;
            gain.disconnect();
            if (doPan === 1) panner.disconnect();
        }, length * 1001);
    }

    /**
     * Voice class.
     * @constructor
     * @constructs Voice.init
     * @param {Synth} synth reference to synth
     * @returns {Voice.init} self
     */
    const Voice = (synth) => new Voice.init(synth);

    /**
     * Voice class.
     * @constructor
     * @constructs Voice.init
     * @param {Synth} synth reference to synth
     * @returns {Voice.init} self
     */
    Voice.init = function (synth) {
        this.master = synth.master;
        this.context = synth.context,
        this.buffer = synth.buffer;
        this.grains = 0;
    }

    Voice.prototype = {
        /**
         * @property
         * @description default offset
         */
        offset: 0,

        /**
         * @property
         * @description default pitch
         */
        trans: 1,

        /**
         * @property
         * @description default attack
         */
        attack: 0.2,

        /**
         * @property
         * @description default release
         */
        release: 1.5,

        /**
         * @property
         * @description default density
         */
        density: 50,

        /**
         * @property
         * @description default spread
         */
        spread: 0.3,

        /**
         * @property
         * @description default panning spread
         */
        pan: 1,

        /**
         * @property
         * @description default master amplitude
         */
        amp: 0.25,

        /**
         * @method play
         * @description play current grain cloud
         */
        play: function () {
            var that = this;
            this.release = Math.max(0.01, this.release);
            this.play = function () {
                grain(that);
                that.timeout = setTimeout(that.play, 100 - that.density);
            };
            this.play();
        },

        /**
         * @method stop
         * @description stop current grain cloud
         */
        stop: function () {
            clearTimeout(this.timeout);
        }
    };

    Voice.init.prototype = Voice.prototype;

    /**
     * Synth class.
     * @constructor
     * @constructs Synth.init
     * @param {AudioContext} context audio context
     * @returns {Synth.init} self
     */
    const Synth = (context) => new Synth.init(context);

    /**
     * Synth class.
     * @constructor
     * @constructs Synth.init
     * @param {AudioContext} context audio context
     * @returns {Synth.init} self
     */
    Synth.init = function (context) {
        this.voices = {};
        this.buffer = null;
        this.context = context;
        this.master = context.createGain();
        this.master.connect(context.destination);
        this.master.gain.setValueAtTime(0.2, 0);
        this.controls = Voice.prototype;
    }

    Synth.prototype = {
        /**
         * @method update
         * @description update callback
         * @param {any} data any data
         */
        update: function (data) {
            if (data && data.hasOwnProperty('freq') && data.hasOwnProperty('state')) {
                if (data.state === 'on') {
                    this.voices[data.voice] = Voice(this);
                    this.voices[data.voice].trans = data.freq / 32.7;
                    this.voices[data.voice].play();
                }
                else {
                    this.voices[data.voice].stop();
                }
            }
        }
    };

    Synth.init.prototype = Synth.prototype;

    global.Synth = Synth;

}(window));

},{}],8:[function(require,module,exports){

/**
 * @function limitTo
 * @description limit number to certain range.
 * @param {number} [num] input number
 * @param {number} [min] lower limit
 * @param {number} [max] upper limit
 * @returns {number} number
 */
const limitTo = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * @function random
 * @description return random number between min and max.
 * @param {number} [min] lower bound of random
 * @param {number} [max] upper bound of random
 * @returns {number} random number
 */
const random = (min, max) => (Math.random() * (max - min)) + min;

/**
 * @function map
 * @description map value from one range to another.
 * @param {number} [num] input number
 * @param {number} [in_min] lower bound of input range
 * @param {number} [in_max] upper bound of input range
 * @param {number} [out_min] lower bound of ouput range
 * @param {number} [out_max] upper bound of output range
 * @returns {number} mapped input number
 */
const map = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

/**
 * @function toRadians
 * @description convert angle from degrees to radians
 * @param {number} [degrees] angle in degress
 * @returns {number} angle in radians
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

},{}],9:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],10:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}]},{},[2]);
