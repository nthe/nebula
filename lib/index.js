(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ELM = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

// default configuration of knob/gauge
const DEFAULT_CIRCLE_CONFIG = {
    value: 0.18,
    radius: 120,
    lineWidth: 16,
    startAngle: 180,
    sweepAngle: 360,
    backdropPadding: 4,
    showHandle: true,
    handleRadius: 2,
    handleColor: '#333',
    rangeColor: '#fc1',
    backdropColor: '#330',
    indicatorColor: '#333',
    rounded: true,
};

/**
 * @function toRadians
 * @description convert angle from degrees to radians
 * @param {number} degrees angle in degress
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * @constructor
 * @constructs Circle
 * @description function construction
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
const Circle = function (id, parent) {
    return new Circle.init(id, parent);
}

/**
 * @constructor
 * @constructs Circle
 * @description function constructor
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
Circle.init = function (id, parent) {

    if (typeof id === 'undefined') {
        throw '(Circle) id is required';
    }

    parent = parent || window.document.body;

    this.id = id;
    this.ctx = null;
    this.element = null;
    this.subscribers = [];

    this.config = Object.assign({}, DEFAULT_CIRCLE_CONFIG);

    this.value = this.config.value;

    // create canvas
    this.element = window.document.createElement("canvas");
    this.element.id = this.id;
    this.ctx = this.element.getContext("2d");
    parent.appendChild(this.element);

    // (re)configure
    this.configure();

    // (pre)render
    this.render();

    // attach listener
    this.activate();
}

Circle.prototype = {

    /**
     * @method render
     * @description (re)render knob/gauge
     * @return {Circle} this
     */
    render: function () {
        // clear
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        let size = this.ctx.canvas.width / 2;
        let angle = toRadians(this.config.sweepAngle) *
            this.value + toRadians(this.config.startAngle);

        // backdrop
        this.ctx.lineWidth = this.config.lineWidth;
        this.ctx.strokeStyle = this.config.backdropColor;
        this.ctx.beginPath();
        this.ctx.arc(
            size,
            size,
            size - (this.config.lineWidth / 2),
            toRadians(this.config.startAngle) - 0.04,
            toRadians((this.config.startAngle + this.config.sweepAngle)) + 0.04
        );
        this.ctx.stroke();

        // value indicator
        this.ctx.lineWidth = this.config.lineWidth - this.config.backdropPadding * 2;
        this.ctx.strokeStyle = this.config.rangeColor;
        this.ctx.beginPath();
        this.ctx.arc(
            size,
            size,
            size - (this.config.lineWidth / 2),
            toRadians(this.config.startAngle),
            angle
        );
        this.ctx.stroke();

        if (this.config.showHandle) {
            this.ctx.beginPath();
            this.ctx.lineWidth = this.config.handleRadius * 2;
            this.ctx.arc(
                size,
                size,
                size - (this.config.lineWidth / 2),
                angle - 0.01,
                angle + 0.01
            );
            this.ctx.strokeStyle = this.config.indicatorColor;
            this.ctx.stroke();
        }

        // trigger callbacks
        // this.onChange(this.value, this);
        this.emit(this.value);
        return this;
    },

    /**
     * @method configure
     * @description update configuration of knob/gauge
     * @param {object} config new (or partial) configuration
     * @returns {Circle} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config);
        this.value = this.config.value;
        this.element.width = this.config.radius;
        this.element.height = this.config.radius;
        this.ctx.canvas.width = this.element.clientWidth;
        this.ctx.canvas.height = this.element.clientHeight;
        this.ctx.lineCap = this.config.rounded ? 'round' : 'butt';
        this.render();
        return this;
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault();
        let initY = event.clientY;

        window.onmouseup = (e) => {
            e.preventDefault();
            window.onmouseup = null;
            window.onmousemove = null;
        };

        window.onmousemove = (e) => {
            e.preventDefault();
            if (e.clientY > initY) {
                this.value -= 0.03;
            } else {
                this.value += 0.03;
            }
            initY = e.clientY;
            this.value = this.value >= 1 ? 1 : this.value;
            this.value = this.value <= 0 ? 0 : this.value;
            this.render();
        };
    },

    /**
     * @method setValue
     * @description update value/progress
     * @param {number} value new value
     * @return {Circle} this
     */
    setValue: function (value) {
        this.value = value;
        this.render();
        return this;
    },

    /**
     * @method subscribe
     * @description register callback for subscription
     * @param {function} callback callback method
     * @returns {Slider} this
     */
    subscribe: function (callback) {
        if (!this.subscribers.indexOf(callback) < 0) {
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
     * @returns {Slider} this
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
     * @method deactivate
     * @description disable knob/gauge
     * @returns {Circle} this
     */
    deactivate: function () {
        this.element.onmousedown = null;
        return this;
    },

    /**
     * @method activate
     * @description enable knob/gauge
     * @returns {Circle} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this);
        return this;
    }
};

// configure prototype chain
Circle.init.prototype = Circle.prototype;

// expose api
module.exports = Circle;

},{}],2:[function(require,module,exports){
"use strict";

/**
 * @method subscribe
 * @description register callback for subscription
 * @param {function} callback callback method
 * @returns {object} this
 */
function subscribe(callback) {
    if (!this.subscribers.indexOf(callback) < 0) {
        return;
    }
    callback.update(this.value);
    this.subscribers.push(callback);
    return this;
}

/**
 * @method unsubscribe
 * @description un-register callback from subscription
 * @param {function} callback callback method
 * @returns {object} this
 */
function unsubscribe (callback) {
    let position = this.subscribers.indexOf(callback);
    if (position < 0) {
        return;
    }
    this.subscribers.splice(position, 1);
    return this;
}

/**
 * @method emit
 * @description calls callbacks of subscribers
 * @param {any} data data to publish
 * @returns {any} data
 */
function emit (data) {
    this.subscribers.map(f => f.update(data));
    return data;
}

/**
 * @method findTouch
 * @description get touch event on given elements
 * @param {Event} [event] raised event
 * @returns {Event} touch event
 */
const findTouch = function (event) {
    if (!event.touches.length) return;
    const touches = [];
    for (let touch of event.touches) {
        if (touch.target.id === this.element.id) touches.push(touch);
    }
    return touches.length ? touches[0] : null;
}

/**
 * Define exports for module.
 */
module.exports = {
    events: { subscribe, unsubscribe, emit },
    touch: { findTouch }
}
},{}],3:[function(require,module,exports){
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
// const Utils    = require('./utils/utils');

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
    }
};

// console.log(lib);
// window.ELM = lib;
module.exports = lib;
// export default lib;
},{"./circle/circle":1,"./keyboard/keyboard":4,"./label/label":5,"./scope/scope":6,"./slider/slider":7,"./synth/synth":8,"./waveform/waveform":10,"./xypad/xypad":11}],4:[function(require,module,exports){
"use strict";
const utils = require('../utils/utils');

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
            }
            
            // handle command key
            if (command) {
                let load = null;
                switch (command) {
                    case 'octave-up':
                        this.octave = utils.limitTo(this.octave + 1, -8, 8);
                        load = { command: command, state: this.octave };
                        break;
                    case 'octave-down':
                        this.octave = utils.limitTo(this.octave - 1, -8, 8);;
                        load = { command: command, state: this.octave };
                        break;
                    case 'velocity-up':
                        this.velocity = utils.limitTo(this.velocity + 5, 0, 127);
                        load = { command: command, state: this.velocity };
                        break;
                    case 'velocity-down':
                        this.velocity = utils.limitTo(this.velocity - 5, 0, 127);
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
        window.removeEventListener('keydown', this.keyHandler.bind(this));
        window.removeEventListener('keyup',   this.keyHandler.bind(this));
        return this;
    },

    /**
     * @method activate
     * @description enable keyboard
     * @returns {KeyBoard} this
     */
    activate: function () {
        window.addEventListener('keydown', this.keyHandler.bind(this));
        window.addEventListener('keyup',   this.keyHandler.bind(this));
        return this;
    }
};

KeyBoard.init.prototype = KeyBoard.prototype;

module.exports = KeyBoard;

},{"../utils/utils":9}],5:[function(require,module,exports){
(function (global){
"use strict";

const DEFAULT_LABEL_CONFIG = {
    value: 0.5,
    color: '#ddd',
    fontSize: 24,
    fontFamily: 'Lucida Console',
};

/**
 * @constructor
 * @constructs Label
 * @description function construction
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
const Label = function (id, parent) {
    return new Label.init(id, parent);
}

/**
 * @constructor
 * @constructs Label
 * @description function constructor
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
Label.init = function (id, parent) {

    if (typeof id === 'undefined') {
        throw '(Label) id is required';
    }

    parent = parent || global.document.body;

    this.id = id;
    this.element = null;
    this.displayValue = null;

    this.config = Object.assign({}, DEFAULT_LABEL_CONFIG);

    this.value = this.config.value;

    // create canvas
    this.element = global.document.createElement("span");
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'none';
    this.element.id = this.id;
    parent.appendChild(this.element);

    // (re)configure
    this.configure({});

    // (pre)render
    this.render();
}

Label.prototype = {

    /**
     * @method
     * @description transformation function for display purposes
     * @returns {number}
     */
    transformer: ((value) => value.toFixed(2)),

    /**
     * @method render
     * @description (re)render label
     * @return {Label} this
     */
    render: function () {
        this.element.innerHTML = this.transformer(this.value);
        return this;
    },

    /**
     * @method configure
     * @description update configuration of knob/gauge
     * @param {object} config new (or partial) configuration
     * @returns {Circle} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config);
        this.value = this.config.value;
        this.element.style.fontFamily = this.config.fontFamily;
        this.element.style.fontSize = this.config.fontSize;
        this.element.style.color = this.config.color;
        this.render();
        return this;
    },

    /**
     * @method update
     * @description update value/progress
     * @param {number} value new value
     * @return {Label} this
     */
    update: function (value) {
        this.value = value;
        this.render();
        return this;
    },
};

Label.init.prototype = Label.prototype;

module.exports = Label;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
var scope_module = (function (global) {
    "use strict";
    
    const Scope = (id, parent) => new Scope.init (id, parent);

    Scope.init = function (id, parent) {
        if (typeof id === 'undefined') throw '(Scope) id is required';
        parent = parent || global.document.body;
        
        this.element = global.document.createElement('canvas');
        this.element.id = id;

        parent.appendChild(this.element)
        // this.run();
    }

    Scope.prototype = {

        run: function () {
            let that = this;
            this.analyser.getByteFrequencyData(this.dataArray);
            var max = {
                src: 0,
                val: 0
            };
            for (let index = 0; index < this.dataArray.length; index++) {
                const element = Math.pow(this.dataArray[index], 2);
                if (element > max.src){
                    max.val = this.dataArray[index];
                    max.src = element;
                } 
            }
            
            console.log('...', this.element.id, max.val, this.analyser.context.sampleRate, this.analyser.context.sampleRate / max.val);
            setTimeout(function () {
                that.run();
            }, 2000);
        },

        init: function (context) {
            this.analyser = context.createAnalyser();
            this.analyser.connect(context.destination);
            this.analyser.fftSize = 256;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.analyser.getByteTimeDomainData(this.dataArray);
            return this;
        },

        connect: function (source) {
            source.connect(this.analyser);
            this.analyser.connect(source.context.destination);
        },

    };

    Scope.init.prototype = Scope.prototype;

    global.Scope = Scope;

})


// auto-init in browser env
if (typeof exports === 'undefined') {
    scope_module(window);
}
// manual load in node env (mock window)
else {
    exports.ScopeMock = function (window) {
        scope_module(window);
    }
}

},{}],7:[function(require,module,exports){
(function (global){
const common = require('../common/common');
"use strict";

// default configuration of slider
const DEFAULT_SLIDER_CONFIG = {
    value: 0.5,
    width: 120,
    lineWidth: 14,
    handleRadius: 0,
    vertical: false,
    showHandle: false,
    rangeColor: '#0af',
    handleColor: '#fff',
    indicatorColor: '#fc1',
    backdropColor: '#424242',
    rounded: true
};

/**
 * @constructor
 * @constructs Slider
 * @description function construction
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
const Slider = function (id, parent) {
    return new Slider.init(id, parent);
}

/**
 * @constructor
 * @constructs Slider
 * @description function constructor
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
Slider.init = function (id, parent) {
    this.id = id;
    this.ctx = null;
    this.element = null;
    this.displayValue = null;

    this.config = Object.assign({}, DEFAULT_SLIDER_CONFIG);
    this.subscribers = [];
    this.value = this.config.value;

    // create canvas
    this.element = global.document.createElement("canvas");
    this.element.id = this.id;
    this.ctx = this.element.getContext("2d");
    parent.appendChild(this.element);

    // (re)configure
    this.configure();

    // (pre)render
    this.render();

    // attach listener
    this.activate();
}

Slider.prototype = {

    /**
     * @property
     * @description helper method for diameter calculation
     * @returns {number} diameter of handle
     */
    get handleDiameter() {
        return this.config.handleRadius * 2;
    },

    get totalWidth() {
        if (this.config.vertical) {
            return Math.max(this.handleDiameter, this.config.lineWidth);
        } else {
            return this.handleDiameter + this.config.width;
        }
    },

    get totalHeight() {
        if (this.config.vertical) {
            return this.handleDiameter + this.config.width;
        } else {
            return Math.max(this.handleDiameter, this.config.lineWidth);
        }
    },

    get sliderMinX() {
        return this.config.handleRadius;
    },

    get sliderMaxX() {
        return this.totalWidth - this.config.handleRadius;
    },

    get sliderMinY() {
        return this.config.handleRadius;
    },

    get sliderMaxY() {
        return this.totalHeight - this.config.handleRadius;
    },

    /**
     * @method render
     * @description (re)render slider
     * @return {Slider} this
     */
    render_horizontal: function () {

        let progress = this.value * this.config.width + this.config.handleRadius;

        // backdrop
        this.ctx.lineWidth = this.config.lineWidth;
        this.ctx.strokeStyle = this.config.backdropColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.sliderMinX, this.sliderMinY);
        this.ctx.lineTo(this.sliderMaxX, this.sliderMinY);
        this.ctx.stroke();

        // value indicator
        this.ctx.lineWidth = this.config.lineWidth;
        this.ctx.strokeStyle = this.config.rangeColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.sliderMinX, this.sliderMinY);// + this.config.lineWidth);
        this.ctx.lineTo(progress, this.sliderMinY);// + this.config.lineWidth);
        this.ctx.stroke();

        if (this.config.showHandle) {
            this.ctx.fillStyle = this.config.handleColor;
            this.ctx.beginPath();
            this.ctx.arc(progress, this.sliderMinY, this.config.handleRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    /**
     * @method render
     * @description (re)render slider
     * @return {Slider} this
     */
    render_vertical: function () {

        let progress = this.value * this.totalHeight - this.config.handleRadius;

        // backdrop
        this.ctx.lineWidth = this.config.lineWidth * 2;
        this.ctx.strokeStyle = this.config.backdropColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.sliderMinX, this.sliderMinY);
        this.ctx.lineTo(this.sliderMinX, this.sliderMaxY);
        this.ctx.stroke();

        // value indicator
        this.ctx.lineWidth = (this.config.lineWidth * 2);
        this.ctx.strokeStyle = this.config.rangeColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.sliderMinX, this.sliderMaxY);
        this.ctx.lineTo(this.sliderMinX, progress);
        this.ctx.stroke();

        if (this.config.showHandle) {
            this.ctx.fillStyle = this.config.handleColor;
            this.ctx.beginPath();
            this.ctx.arc(this.sliderMinY, progress, this.config.handleRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    /**
     * @method render
     * @description (re)render slider
     * @return {Slider} this
     */
    render: function () {
        // clear
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // render
        if (this.config.vertical) {
            this.render_vertical();
        } else {
            this.render_horizontal();
        }

        // trigger callbacks
        this.onChange(this.value, this.displayValue, this);
        this.emit(this.value);
        return this;
    },

    /**
     * @method configure
     * @description update configuration of slider
     * @param {object} config new (or partial) configuration
     * @returns {Slider} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config);
        this.value = this.config.value;
        this.element.width = this.totalWidth;
        this.element.height = this.totalHeight;
        this.ctx.canvas.width = this.element.clientWidth;
        this.ctx.canvas.height = this.element.clientHeight;
        this.ctx.lineCap = this.config.rounded ? 'round' : 'butt';
        this.render();
        return this;
    },

    /**
     * @method displayFunction
     * @description function between internal and display value
     * @returns {string} display value
     */
    displayFunction: function () {
        this.displayValue = Math.pow(this.value * 10, 2);
        return this.displayValue;
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault();

        global.document.onmouseup = (event) => {
            event.preventDefault();
            global.document.onmouseup = null;
            global.document.onmousemove = null;
        };

        global.document.onmousemove = (event) => {
            event.preventDefault();
            if (this.config.vertical) {
                let off = this.ctx.canvas.getBoundingClientRect().top;
                this.value = ((event.clientY - off) / this.totalHeight);
            } else {
                let off = this.ctx.canvas.getBoundingClientRect().left;
                this.value = ((event.clientX - off) / this.config.width);
            }
            this.value = this.value >= 1 ? 1 : this.value;
            this.value = this.value <= 0 ? 0 : this.value;
            this.render();
        };
    },

    /**
     * @method setValue
     * @description update value/progress
     * @param {number} value new value
     * @return {Slider} this
     */
    setValue: function (value) {
        this.value = value;
        this.render();
        return this;
    },

    /**
     * @method onChange
     * @description called with value changed
     * @param {number} value current value
     * @param {string} displayValue display value
     * @param {Slider} self this
     */
    onChange: ((value, displayValue, self) => { }),

    subscribe:      common.events.subscribe,
    unsubscribe:    common.events.unsubscribe,
    emit:           common.events.emit,

    /**
     * @method deactivate
     * @description disable slider
     * @returns {Slider} this
     */
    deactivate: function () {
        this.element.onmousedown = null;
        return this;
    },

    /**
     * @method activate
     * @description enable slider
     * @returns {Slider} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this);
        return this;
    }
};

Slider.init.prototype = Slider.prototype;

module.exports.Slider = Slider;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../common/common":2}],8:[function(require,module,exports){
const utils = require('../utils/utils');
"use strict";

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
    const doPan = parseInt(utils.random(0, 3), 10);
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
        panner.setPosition(utils.random(voice.pan * -1, voice.pan), 0, 0);
        source.connect(panner);
        panner.connect(gain);
    } 
    else {
        source.connect(gain);
    }
    
    const length = voice.attack + voice.release;
    const offset = Math.max(0, voice.offset * voice.buffer.duration);
    const randomOffset = Math.abs((Math.random() * voice.spread) - (voice.spread / 2));
    
    source.start(context.currentTime, offset + randomOffset, length);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(voice.amp, context.currentTime + voice.attack);
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
    release: 0.75,

    /**
     * @property
     * @description default decay
     */
    decay: 1.0,

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
        const that = this;
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
        const that = this;
        const decayInMS = that.decay * 1000;
        const now = +new Date();
        const init_amp = this.amp;
        this.preDecay = function () {
            that.amp = init_amp * (1 - (Number.parseFloat(+new Date() - now) / decayInMS));
            if (that.amp > 0.0001) {
                setTimeout(that.preDecay, 0);
            }
            else {
                clearTimeout(that.timeout);
            }
        }
        this.preDecay();
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

module.exports = Synth;

},{"../utils/utils":9}],9:[function(require,module,exports){

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


module.exports = { 
    limitTo,
    random,
    map,
    toRadians
};
},{}],10:[function(require,module,exports){
"use strict";
var utils = require('../utils/utils');

const DEFAULT_WAVEFORM_CONFIG = {
    width: 500,
    height: 125,
    strokeColor: '#fff',
    indicatorColor: '#fc1'
};

const WaveForm = (id, parent) => new WaveForm.init(id, parent);

WaveForm.init = function (id, parent) {
    this.element = window.document.createElement('div');
    this.backdrop = window.document.createElement('canvas');
    this.front = window.document.createElement('canvas');

    this.backdrop.style.position = 'absolute';
    this.backdrop.style.margin = '0';
    this.front.style.position = 'absolute';
    this.front.style.backgroundColor = 'transparent';
    this.front.style.margin = '0';
    this.backdrop.id = `${id}-backdrop`;
    this.front.id = `${id}-front`;
    this.element.id = id;
    
    this.config = Object.assign({}, DEFAULT_WAVEFORM_CONFIG);
    this.element.style.minWidth = this.config.width;
    this.element.style.minHeight = this.config.height;

    this.element.appendChild(this.backdrop);
    this.element.appendChild(this.front);
    parent.appendChild(this.element);
    this.value = 0.5;
    this.buffer = null;
    this.activate();
};

WaveForm.prototype = {
    drawWave: function (data) {
        var ctx = this.backdrop.getContext('2d');
        var fctx = this.front.getContext('2d');
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        //draw the buffer
        var step = Math.ceil(data.length / w);
        var amp = h / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.translate(0.5, 0.5);

        ctx.strokeStyle = this.config.strokeColor;

        for (var i = 0; i < w; i++) {
            var min = 1.0;
            var max = -1.0;

            for (let j = 0; j < step; j++) {
                var datum = data[(i * step) + j];
                if (datum < min) {
                    min = datum;
                }
                else if (datum > max) {
                    max = datum;
                }
            }
            let y = (1 + min) * amp;
            let ht = Math.max(1, (max - min) * amp);
            if (ht === 1) {
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(i, y)
            ctx.lineTo(i, y + ht);
            ctx.stroke();
        }

        this.render();

    },

    render: function () {
        var fctx = this.front.getContext('2d');
        var w = fctx.canvas.width;
        var h = fctx.canvas.height;
        fctx.clearRect(0, 0, w, h);
        fctx.strokeStyle = this.config.indicatorColor;
        fctx.lineWidth = 1;
        fctx.beginPath();
        fctx.moveTo(this.value * w, 0)
        fctx.lineTo(this.value * w, h);
        fctx.stroke();
    },

    update: function (data) {
        this.value = data.x;
        this.render();
    },

    dragOverHandler: function (event) {
        event.preventDefault();
    },

    dropHandler: function (event) {
        event.preventDefault();
        var file = event.dataTransfer.files[0];
        var reader = new FileReader();
        var that = this;
        reader.onload = function (event) {
            var array = event.target.result;
            context.decodeAudioData(
                array,
                function (b) {
                    that.buffer = b;
                    that.drawWave(b.getChannelData(0));
                },
                function () {
                    alert('loading failed');
                }
            );
        }
        reader.readAsArrayBuffer(file);
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault();
        const clickedId = event.target.id;
        const w = this.backdrop.width;
        
        if (event.offsetX <= w) this.value = event.offsetX / w;
        
        this.render();

        window.document.onmouseup = (e) => {
            e.preventDefault();
            window.document.onmouseup = null;
            window.document.onmousemove = null;
        };

        window.document.onmousemove = (e) => {
            e.preventDefault();
            if (e.target.id !== clickedId) return;
            const w = this.backdrop.width;
            if (e.offsetX <= w) this.value = e.offsetX / w;
            this.render();
        };
    },

    load: function (url, callback) {
        var request = new window.XMLHttpRequest();
        var that = this;
        request.open('GET', url, true);
        request.responseType = "arraybuffer";
        request.onload = function () {
            context.decodeAudioData(
                request.response,
                function (b) {
                    that.buffer = b;
                    that.drawWave(b.getChannelData(0));
                    callback(b);
                },
                function () {
                    alert('loading failed');
                }
            );
        };
        request.send();
        return this;
    },

    deactivate: function () {
        this.element.removeEventListener('dragover', this.dragOverHandler.bind(this), false);
        this.element.removeEventListener('drop', this.dropHandler.bind(this), false);
        this.element.onmousedown = null
    },

    activate: function () {
        this.element.addEventListener('dragover', this.dragOverHandler.bind(this), false);
        this.element.addEventListener('drop', this.dropHandler.bind(this), false);
        this.element.onmousedown = this.mouseDragHandler.bind(this);
    }
};

WaveForm.init.prototype = WaveForm.prototype;

module.exports = WaveForm;

},{"../utils/utils":9}],11:[function(require,module,exports){
"use strict";
const common = require("../common/common");

// default configuration of knob/gauge
const DEFAULT_XYPAD_CONFIG = {
    value: 0.18,
    radius: 120,
    lineWidth: 16,
    startAngle: 180,
    sweepAngle: 360,
    backdropPadding: 4,
    showHandle: true,
    handleRadius: 2,
    handleColor: '#333',
    rangeColor: '#fc1',
    backdropColor: '#330',
    indicatorColor: '#333',
    rounded: true,
};

const XYPad = (id, parent) => new XYPad.init(id, parent);

XYPad.init = function (id, parent) {
    if (typeof id === 'undefined') {
        throw '(XYPad) id is required';
    }

    parent = parent || window.document.body;

    this.id = id;
    this.ctx = null;
    this.element = null;
    this.subscribers = [];

    this.config = Object.assign({}, DEFAULT_XYPAD_CONFIG);
    this.config.showCrossHair = true;
    this.value = { x: 0.75  , y: 0.62 };

    // create canvas
    this.element = window.document.createElement("canvas");
    this.element.id = this.id;
    this.ctx = this.element.getContext("2d");
    parent.appendChild(this.element);

    // (re)configure
    this.configure();

    // (pre)render
    this.render();

    // attach listener
    this.activate();
}


XYPad.prototype = {
    /**
     * @method render
     * @description (re)render knob/gauge
     * @return {Circle} this
     */
    render: function () {
        // clear
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const top = this.ctx.canvas.height * this.value.y;
        const left = this.ctx.canvas.width * this.value.x;

        if (this.config.showCrossHair) {
            this.ctx.strokeStyle = "#777";
            this.ctx.beginPath();
            this.ctx.moveTo(0, top);
            this.ctx.lineTo(this.ctx.canvas.width, top);
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(left, 0);
            this.ctx.lineTo(left, this.ctx.canvas.height);
            this.ctx.stroke();
        }

        if (this.config.showHandle) {
            this.ctx.beginPath();
            this.ctx.arc(left, top, 4, 0, 2 * Math.PI);
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = "#fc1";
            this.ctx.strokeStyle = "#fc1";
            this.ctx.stroke();
            this.ctx.fill();
        }

        // trigger callback
        this.emit(this.value);
        return this;
    },

    /**
     * @method configure
     * @description update configuration of knob/gauge
     * @param {object} config new (or partial) configuration
     * @returns {XYPad} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config);

        this.element.style.width = this.config.width;
        this.element.style.height = this.config.height;
        this.element.style.backgroundColor = "#3a3a3a";
        this.element.style.boxShadow = "inset 0 0 16px #111";
        this.element.style.marginTop = "8px";
        this.element.style.border = "0 solid transparent";
        this.element.style.boxSizing = "border-box";
        this.element.style.borderRadius = "8px";

        this.ctx.canvas.width = this.element.clientWidth;
        this.ctx.canvas.height = this.element.clientHeight;

        this.render();
        return this;
    },

    
    touchDragHandler: function (event) {
        event.preventDefault();
        const clickedId = event.target.id;
        const w = this.ctx.canvas.width;
        const h = this.ctx.canvas.height;
        const touch = this.findTouch(event);
        this.value.x = (touch.clientX - touch.target.offsetLeft) / w;
        this.value.y = (touch.clientY - touch.target.offsetTop) / h;
        
        this.element.ontouchend = (e) => {
            e.preventDefault();
            this.element.ontouchend = null;
            this.element.ontouchmove = null;
        };
        
        this.element.ontouchmove = (e) => {
            e.preventDefault();
            if (e.target.id !== clickedId) return;
            const touch = this.findTouch(e);
            const w = this.ctx.canvas.width;
            const h = this.ctx.canvas.height;
            this.value.x = (touch.clientX - touch.target.offsetLeft) / w;
            this.value.y = (touch.clientY - touch.target.offsetTop) / h;
            this.render();
        };
        
        this.render();
    },
    
    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault();
        const clickedId = event.target.id;
        const w = this.ctx.canvas.width;
        const h = this.ctx.canvas.height;
        
        
        if (event.offsetX <= w) this.value.x = event.offsetX / w;
        if (event.offsetY <= h) this.value.y = event.offsetY / h;

        window.document.onmouseup = (e) => {
            e.preventDefault();
            window.document.onmouseup = null;
            window.document.onmousemove = null;
        };
        
        window.document.onmousemove = (e) => {
            e.preventDefault();
            if (e.target.id !== clickedId) return;
            const w = this.ctx.canvas.width;
            const h = this.ctx.canvas.height;
            if (e.offsetX <= w) this.value.x = e.offsetX / w;
            if (e.offsetY <= h) this.value.y = e.offsetY / h;
            this.render();
        };
        
        this.render();        
    },
    
    findTouch:      common.touch.findTouch,
    subscribe:      common.events.subscribe,
    unsubscribe:    common.events.unsubscribe,
    emit:           common.events.emit,

    /**
     * @method deactivate
     * @description disable pad
     * @returns {XYPad} this
     */
    deactivate: function () {
        this.element.onmousedown = null;
        this.element.ontouchstart = null;
        return this;
    },

    /**
     * @method activate
     * @description enable pad
     * @returns {XYPad} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this);
        this.element.ontouchstart = this.touchDragHandler.bind(this);
        return this;
    }
};

XYPad.init.prototype = XYPad.prototype;

module.exports = XYPad;

},{"../common/common":2}]},{},[3])(3)
});
