(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ELM = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const common = require('../common/common')
const utils = require('../utils/utils')
;('use strict')

// default configuration of knob/gauge
const DEFAULT_CIRCLE_CONFIG = {
    value: 0.18,
    radius: 64,
    lineWidth: 3,
    startAngle: 180,
    sweepAngle: 360,
    backdropPadding: 4,
    showHandle: false,
    handleRadius: 2,
    handleColor: '#333',
    rangeColor: '#1cf',
    backdropColor: '#424242',
    indicatorColor: '#333',
    rounded: true,
}

/**
 * @function toRadians
 * @description convert angle from degrees to radians
 * @param {number} degrees angle in degress
 */
const toRadians = (degrees) => degrees * (Math.PI / 180)

/**
 * @constructor
 * @constructs Circle
 * @description function construction
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
const Circle = function (id, parent) {
    return new Circle.init(id, parent)
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
        throw '(Circle) id is required'
    }

    this.parent = parent || window.document.body

    this.id = id
    this.ctx = null
    this.element = null
    this.subscribers = []

    this.config = Object.assign({}, DEFAULT_CIRCLE_CONFIG)

    this.value = this.config.value

    // create canvas
    this.element = window.document.createElement('canvas')
    this.element.id = this.id
    this.ctx = this.element.getContext('2d')
    this.parent.appendChild(this.element)

    // (re)configure
    this.configure()

    // (pre)render
    this.render()

    // attach listener
    this.activate()
}

Circle.prototype = {
    /**
     * @method addLabel
     * @description add label to knob
     * @param {string} text label text
     * @returns {Circle} this
     */
    addLabel: function (text) {
        const label = document.createElement('p')
        label.innerText = text
        label.style.position = 'absolute'
        label.style.color = '#888'
        label.style.top = this.element.offsetTop + 15
        label.style.fontSize = '.7rem'
        label.className = 'element-knob-label'
        this.parent.appendChild(label)
        return this
    },

    /**
     * @method render
     * @description (re)render knob/gauge
     * @return {Circle} this
     */
    render: function () {
        // clear
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        let size = this.ctx.canvas.width / 2
        let angle =
            toRadians(this.config.sweepAngle) * this.value +
            toRadians(this.config.startAngle)

        // backdrop
        this.ctx.lineWidth = this.config.lineWidth
        this.ctx.strokeStyle = this.config.backdropColor
        this.ctx.beginPath()
        this.ctx.arc(
            size,
            size,
            size - this.config.lineWidth / 2,
            toRadians(this.config.startAngle) - 0.04,
            toRadians(this.config.startAngle + this.config.sweepAngle) + 0.04
        )
        this.ctx.stroke()

        // value indicator
        this.ctx.lineWidth =
            this.config.lineWidth - this.config.backdropPadding * 2
        this.ctx.strokeStyle = this.config.rangeColor
        this.ctx.beginPath()
        this.ctx.arc(
            size,
            size,
            size - this.config.lineWidth / 2,
            toRadians(this.config.startAngle),
            angle
        )
        this.ctx.stroke()

        if (this.config.showHandle) {
            this.ctx.beginPath()
            this.ctx.lineWidth = this.config.handleRadius * 2
            this.ctx.arc(
                size,
                size,
                size - this.config.lineWidth / 2,
                angle - 0.01,
                angle + 0.01
            )
            this.ctx.strokeStyle = this.config.indicatorColor
            this.ctx.stroke()
        }

        // trigger callbacks
        // this.onChange(this.value, this);
        this.emit(this.value)
        return this
    },

    /**
     * @method configure
     * @description update configuration of knob/gauge
     * @param {object} config new (or partial) configuration
     * @returns {Circle} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config)
        this.value = this.config.value
        this.element.width = this.config.radius
        this.element.height = this.config.radius
        this.ctx.canvas.width = this.element.clientWidth
        this.ctx.canvas.height = this.element.clientHeight
        this.ctx.lineCap = this.config.rounded ? 'round' : 'butt'
        this.render()
        return this
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault()

        window.onmouseup = (e) => {
            e.preventDefault()
            window.onmouseup = null
            window.onmousemove = null
        }

        window.onmousemove = (e) => {
            e.preventDefault()
            this.value -= e.movementY / 200
            this.value = utils.limitTo(this.value, 0, 1)
            this.render()
        }
    },

    /**
     * @method setValue
     * @description update value/progress
     * @param {number} value new value
     * @return {Circle} this
     */
    setValue: function (value) {
        this.value = value
        this.render()
        return this
    },

    subscribe: common.events.subscribe,
    unsubscribe: common.events.unsubscribe,
    emit: common.events.emit,

    /**
     * @method deactivate
     * @description disable knob/gauge
     * @returns {Circle} this
     */
    deactivate: function () {
        this.element.onmousedown = null
        return this
    },

    /**
     * @method activate
     * @description enable knob/gauge
     * @returns {Circle} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this)
        return this
    },

    /**
     * @method withLabel
     * @description rendered centered label
     * @returns {Circle} this;
     */
    withLabel: function (text, top = 100, size = 11) {
        const label = document.createElement('p')
        label.classList.add('label')
        label.innerText = text
        // console.log(label, this.element.offsetTop)
        label.style.top = top
        label.style.fontSize = size
        this.parent.appendChild(label)
        return this
    },
}

// configure prototype chain
Circle.init.prototype = Circle.prototype

// expose api
module.exports = Circle

},{"../common/common":2,"../utils/utils":7}],2:[function(require,module,exports){
'use strict'

/**
 * @method subscribe
 * @description register callback for subscription
 * @param {function} callback callback method
 * @returns {object} this
 */
function subscribe(callback) {
    // console.log(this)
    this.subscribers = this.subscribers || []
    if (!this.subscribers.indexOf(callback) < 0) {
        return
    }
    callback.update(this.value)
    this.subscribers.push(callback)
    return this
}

/**
 * @method unsubscribe
 * @description un-register callback from subscription
 * @param {function} callback callback method
 * @returns {object} this
 */
function unsubscribe(callback) {
    let position = this.subscribers.indexOf(callback)
    if (position < 0) {
        return
    }
    this.subscribers.splice(position, 1)
    return this
}

/**
 * @method emit
 * @description calls callbacks of subscribers
 * @param {any} data data to publish
 * @returns {any} data
 */
function emit(data) {
    this.subscribers.map(f => f.update(data))
    return data
}

/**
 * @method findTouch
 * @description get touch event on given elements
 * @param {Event} [event] raised event
 * @returns {Event} touch event
 */
const findTouch = function(event) {
    if (!event.touches.length) return
    const touches = []
    for (let touch of event.touches) {
        if (touch.target.id === this.element.id) touches.push(touch)
    }
    return touches.length ? touches[0] : null
}

/**
 * Define exports for module.
 */
module.exports = {
    events: { subscribe, unsubscribe, emit },
    touch: { findTouch },
}

},{}],3:[function(require,module,exports){
const Synth = require('./synth/synth')
const KeyBoard = require('./keyboard/keyboard')
const Circle = require('./circle/circle')
const Scope = require('./scope/scope')
const WaveForm = require('./waveform/waveform')
const XYPad = require('./xypad/xypad')

module.exports = {
    Synth: Synth,
    KeyBoard: KeyBoard,
    GUI: {
        Circle: Circle,
        Scope: Scope,
        WaveForm: WaveForm,
        XYPad: XYPad,
    },
}

},{"./circle/circle":1,"./keyboard/keyboard":4,"./scope/scope":5,"./synth/synth":6,"./waveform/waveform":8,"./xypad/xypad":9}],4:[function(require,module,exports){
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
        const key = event.key.toLowerCase();
        const note = keyToNoteMap[key];
        const command = keyToCommandsMap[key];
        
        if (event.type === 'keydown') {
            // check if note should be (re)triggered
            const doTrigger = !this.heldKeys.hasOwnProperty(key) || this.holdMode;
            
            // handle note key
            if (note && doTrigger) {
                const voice = this.activeVoices++;
                this.heldKeys[key] = voice;
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
            const heldKey = this.heldKeys[key];
            if (typeof heldKey !== 'undefined' && !this.holdMode) {
                delete this.heldKeys[key];
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

},{"../utils/utils":7}],5:[function(require,module,exports){
(function (global){
'use strict'

const Scope = (id, parent) => new Scope.init(id, parent)

Scope.init = function(id, parent) {
    if (typeof id === 'undefined') throw '(Scope) id is required'
    parent = parent || global.document.body

    this.element = global.document.createElement('canvas')
    this.element.id = id

    this.element.width = 500
    this.element.height = 55
    parent.appendChild(this.element)
    // this.run();
}

Scope.prototype = {
    run: function() {
        let that = this
        this.analyser.getByteFrequencyData(this.dataArray)
        var max = {
            src: 0,
            val: 0,
        }

        const step = (this.element.width / this.analyser.fftSize) * 2
        const ctx = this.element.getContext('2d')
        ctx.clearRect(0, 0, 500, 55)
        ctx.canvas.width = 500
        ctx.canvas.height = 55
        ctx.strokeStyle = '#aaa'
        ctx.fillStyle = '#aaa'
        ctx.lineWidth = 1
        const base = Math.log(this.dataArray.length)
        for (let index = 0; index < this.dataArray.length; index++) {
            let x = (Math.log(index) / base) * ctx.canvas.width
            let bin = this.dataArray[index]
            ctx.beginPath()
            ctx.strokeStyle = '#aaa'
            ctx.moveTo(x, 55)
            ctx.lineTo(x, 55 - (bin / 256) * 55)
            ctx.stroke()
        }
        setTimeout(function() {
            that.run()
        }, 50)
    },

    init: function(context) {
        this.analyser = context.createAnalyser()
        this.analyser.connect(context.destination)
        this.analyser.fftSize = 256
        this.bufferLength = this.analyser.frequencyBinCount
        this.dataArray = new Uint8Array(this.bufferLength)
        this.analyser.getByteTimeDomainData(this.dataArray)
        return this
    },

    connect: function(source) {
        source.connect(this.analyser)
        this.analyser.connect(source.context.destination)
        return this
    },
}

Scope.init.prototype = Scope.prototype

module.exports = Scope

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
const utils = require('../utils/utils')
;('use strict')

/**
 * @function grain
 * @description play a grain sound
 * @param {Voice} voice voice
 */
function grain(voice) {
    if (!voice.buffer) return

    const context = voice.context
    const doPan = parseInt(utils.random(0, 3), 10)
    const gain = context.createGain()
    const source = context.createBufferSource()
    source.playbackRate.setValueAtTime(
        source.playbackRate.value * voice.trans,
        context.currentTime
    )
    source.buffer = voice.buffer
    gain.connect(voice.master)

    let panner
    if (doPan === 1) {
        panner = context.createPanner()
        panner.panningModel = 'equalpower'
        panner.distanceModel = 'linear'
        panner.setPosition(utils.random(voice.pan * -1, voice.pan), 0, 0)
        source.connect(panner)
        panner.connect(gain)
    } else {
        source.connect(gain)
    }

    const attack =
        voice.grainSkew === 1
            ? voice.grainSize - 0.001
            : voice.grainSize * voice.grainSkew
    const offset = Math.max(0, voice.offset * voice.buffer.duration)
    const randomOffset = Math.abs(
        Math.random() * voice.spread - voice.spread / 2
    )

    source.start(context.currentTime, offset + randomOffset, voice.grainSize)
    gain.gain.setValueAtTime(0, context.currentTime)
    gain.gain.linearRampToValueAtTime(voice.amp, context.currentTime + attack)
    gain.gain.linearRampToValueAtTime(0, context.currentTime + voice.grainSize)
    source.stop(context.currentTime + voice.grainSize)

    return () => {
        gain.disconnect()
        if (doPan === 1) panner.disconnect()
    }
}

/**
 * Voice class.
 * @constructor
 * @constructs Voice.init
 * @param {Synth} synth reference to synth
 * @returns {Voice.init} self
 */
const Voice = (synth) => new Voice.init(synth)

/**
 * Voice class.
 * @constructor
 * @constructs Voice.init
 * @param {Synth} synth reference to synth
 * @returns {Voice.init} self
 */
Voice.init = function (synth) {
    this.master = context.createGain()
    this.active = false
    this.synth = synth
    this.master.connect(synth.filter)
    this.master.connect(synth.convolverGain)
    this.master.gain.setValueAtTime(0.95, 0)
    ;(this.context = synth.context), (this.buffer = synth.buffer)
    this.grains = 0
    this.grainsList = []
}

Voice.prototype = {
    offset: 0, // sample position
    trans: 1, // playback speed
    attack: 0.2, // sound attack
    release: 0.5, // sound release
    amp: 0.95, // amplitude

    grainSize: 1, // grain size (length)
    grainSkew: 0.5, // grain window skew
    density: 50, // grain density
    spread: 0.3, // grain spread
    pan: 1, // grain spatial position

    /**
     * @method play
     * @description play current grain cloud
     */
    play: function () {
        const that = this
        this.release = Math.max(0.01, this.release)
        this.play = function () {
            if (that.grainsList.length > 50) {
                let disconnector = that.grainsList.shift()
                disconnector()
            }

            that.grainsList.push(grain(that))

            if (!that.active) return

            that.timeout = setTimeout(that.play, 100 - that.density)
        }
        this.active = true
        this.play()

        this.master.gain.setValueAtTime(0.0, this.context.currentTime)
        this.master.gain.linearRampToValueAtTime(
            this.amp,
            this.context.currentTime + this.attack
        )
    },

    /**
     * @method stop
     * @description stop current grain cloud
     */
    stop: function (callback) {
        this.master.gain.linearRampToValueAtTime(
            0.0,
            this.context.currentTime + this.release
        )
        this.active = false
        callback(this.context.currentTime + this.release)
    },
}

Voice.init.prototype = Voice.prototype

/**
 * Synth class.
 * @constructor
 * @constructs Synth.init
 * @param {AudioContext} context audio context
 * @returns {Synth.init} self
 */
const Synth = (context) => new Synth.init(context)

/**
 * Synth class.
 * @constructor
 * @constructs Synth.init
 * @param {AudioContext} context audio context
 * @returns {Synth.init} self
 */
Synth.init = function (context) {
    this.voice = null
    this.buffer = null
    this.context = context

    this.filter = context.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.setValueAtTime(20000, this.context.currentTime)
    this.filter.Q.setValueAtTime(0, this.context.currentTime)
    this.filter.gain.setValueAtTime(0.5, this.context.currentTime)

    this.convolver = context.createConvolver()
    this.convolver.loop = false
    this.convolver.normalize = true
    this.convolverGain = context.createGain()
    this.convolverGain.gain.setValueAtTime(0, this.context.currentTime)
    this.convolverGain.connect(this.convolver)
    this.convolver.connect(this.filter)

    this._amp = 0.95
    this.master = context.createGain()
    this.filter.connect(this.master)
    this.master.connect(context.destination)
    this.master.gain.setValueAtTime(this._amp, 0)
    this.controls = Voice.prototype
}

Synth.prototype = {
    filterTypes: [
        'lowpass', // pass thru frequencies below cutoff
        'highpass', // pass thru frequencies above cutoff
        'bandpass', // pass thru frequencies around cutoff (width defined by Q)
        'lowshelf', // boost or attenuate frequencies below cutoff (based on gain)
        'highshelf', // boost or attenuate frequencies above cutoff (based on gain)
        'peaking', // boost or attenuate frequencies around cutoff (based on gain)
        'notch', // cut frequencies around cutoff (based on gain)
        'allpass', // pass everything but invert phase at cutoff
    ],

    set amp(value) {
        this._amp = value
        this.master.gain.setValueAtTime(this._amp, 0.0)
    },

    set cutoff(value) {
        this.filter.frequency.setValueAtTime(value, this.context.currentTime)
    },

    set Q(value) {
        this.filter.Q.setValueAtTime(value, this.context.currentTime)
    },

    set gain(value) {
        this.filter.gain.setValueAtTime(value, this.context.currentTime)
    },

    set filterType(value) {
        this.filter.type = value
    },

    /**
     * @method update
     * @description update callback
     * @param {any} data any data
     */
    update: function (data) {
        if (
            data &&
            data.hasOwnProperty('freq') &&
            data.hasOwnProperty('state')
        ) {
            if (data.state === 'on' && this.voice == null) {
                this.voice = Voice(this)
                this.voice.play()
            } else {
                this.voice.stop(() => {
                    this.voice = null
                })
            }
        }
    },
}

Synth.init.prototype = Synth.prototype

module.exports = Synth

},{"../utils/utils":7}],7:[function(require,module,exports){

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

/**
 * @function angle
 * @description calculate angle (in degrees) between three points
 * @param {object} p1 coordinates of center points
 * @param {object} p2 coordinates of leg point
 * @param {object} p3 coordinates of leg point
 * @returns {number} angle
 */
const angle = function (p1, p2, p3) {
    const p12 = Math.sqrt(Math.pow((p1.x - p2.x),2) + Math.pow((p1.y - p2.y),2));
    const p13 = Math.sqrt(Math.pow((p1.x - p3.x),2) + Math.pow((p1.y - p3.y),2));
    const p23 = Math.sqrt(Math.pow((p2.x - p3.x),2) + Math.pow((p2.y - p3.y),2));
    return Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13)) * 180 / Math.PI;
}; 

module.exports = { 
    limitTo,
    random,
    map,
    toRadians,
    angle
};
},{}],8:[function(require,module,exports){
'use strict'
var utils = require('../utils/utils')
const common = require('../common/common')

const DEFAULT_WAVEFORM_CONFIG = {
    width: 500,
    height: 100,
    strokeColor: '#fff',
    indicatorColor: '#fc1',
}

const WaveForm = (id, parent, synth) => new WaveForm.init(id, parent, synth)

WaveForm.init = function (id, parent, synth) {
    this.element = window.document.createElement('div')
    this.backdrop = window.document.createElement('canvas')
    this.front = window.document.createElement('canvas')
    this.element.style.width = '500px'
    this.element.style.height = '100px'
    this.backdrop.getContext('2d').canvas.width = 500
    this.backdrop.getContext('2d').canvas.height = 100
    this.front.getContext('2d').canvas.width = 500
    this.front.getContext('2d').canvas.height = 100

    this.backdrop.style.position = 'absolute'
    // this.backdrop.style.margin = '0'
    this.front.style.position = 'absolute'
    this.front.style.backgroundColor = 'transparent'
    // this.front.style.margin = '0'
    this.backdrop.id = `${id}-backdrop`
    this.front.id = `${id}-front`
    this.element.id = id

    this.config = Object.assign({}, DEFAULT_WAVEFORM_CONFIG)
    this.element.style.minWidth = this.config.width
    this.element.style.minHeight = this.config.height

    this.element.appendChild(this.backdrop)
    this.element.appendChild(this.front)
    parent.appendChild(this.element)
    this.value = 0.5
    this.buffer = null
    this.synth = synth
    this.subscribers = []
    this.activate()
}

WaveForm.prototype = {
    subscribe: common.events.subscribe,
    unsubscribe: common.events.unsubscribe,
    emit: common.events.emit,

    drawWave: function (data) {
        var ctx = this.backdrop.getContext('2d')
        // var fctx = this.front.getContext('2d')
        var w = ctx.canvas.width
        var h = ctx.canvas.height
        //draw the buffer
        var step = Math.ceil(data.length / w)
        var amp = h / 2

        ctx.clearRect(0, 0, w, h)
        ctx.translate(0.5, 0.5)

        ctx.strokeStyle = this.config.strokeColor

        for (var i = 0; i < w; i++) {
            var min = 1.0
            var max = -1.0

            for (let j = 0; j < step; j++) {
                var datum = data[i * step + j]
                if (datum < min) {
                    min = datum
                } else if (datum > max) {
                    max = datum
                }
            }
            let y = (1 + min) * amp
            let ht = Math.max(1, (max - min) * amp)
            if (ht === 1) {
                continue
            }
            ctx.beginPath()
            ctx.moveTo(i, 0.5)
            ctx.lineTo(i, 0.5 + ht)
            ctx.stroke()
        }

        this.render()
    },

    render: function () {
        var fctx = this.front.getContext('2d')
        var w = fctx.canvas.width
        var h = fctx.canvas.height
        fctx.clearRect(0, 0, w, h)
        fctx.strokeStyle = this.config.indicatorColor
        fctx.lineWidth = 0.5
        fctx.beginPath()
        fctx.moveTo(this.value * w, 0)
        fctx.lineTo(this.value * w, h * 1.5)
        fctx.stroke()
    },

    update: function (data) {
        this.value = data.x
        this.render()
    },

    dragOverHandler: function (event) {
        event.preventDefault()
    },

    dropHandler: function (event) {
        event.preventDefault()
        var file = event.dataTransfer.files[0]
        var reader = new FileReader()
        var that = this
        reader.onload = function (event) {
            var array = event.target.result
            context.decodeAudioData(
                array,
                function (b) {
                    that.buffer = b
                    that.drawWave(b.getChannelData(0))
                    that.synth.buffer = b
                },
                function () {
                    alert('loading failed')
                }
            )
        }
        reader.readAsArrayBuffer(file)
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault()
        const clickedId = event.target.id
        const w = this.backdrop.width

        if (event.offsetX <= w) this.value = event.offsetX / w

        this.render()

        window.document.onmouseup = (e) => {
            e.preventDefault()
            window.document.onmouseup = null
            window.document.onmousemove = null
        }

        window.document.onmousemove = (e) => {
            e.preventDefault()
            if (e.target.id !== clickedId) return
            const w = this.backdrop.width
            if (e.offsetX <= w) this.value = e.offsetX / w
            this.render()
        }
    },

    load: function (url, callback) {
        var request = new window.XMLHttpRequest()
        var that = this
        request.open('GET', url, true)
        request.responseType = 'arraybuffer'
        request.onload = function () {
            context.decodeAudioData(
                request.response,
                function (b) {
                    that.buffer = b
                    that.drawWave(b.getChannelData(0))
                    callback(b)
                },
                function () {
                    alert('loading failed')
                }
            )
        }
        request.send()
        return this
    },

    deactivate: function () {
        this.element.removeEventListener(
            'dragover',
            this.dragOverHandler.bind(this),
            false
        )
        this.element.removeEventListener(
            'drop',
            this.dropHandler.bind(this),
            false
        )
        this.element.onmousedown = null
    },

    activate: function () {
        this.element.addEventListener(
            'dragover',
            this.dragOverHandler.bind(this),
            false
        )
        this.element.addEventListener(
            'drop',
            this.dropHandler.bind(this),
            false
        )
        this.element.onmousedown = this.mouseDragHandler.bind(this)
    },
}

WaveForm.init.prototype = WaveForm.prototype

module.exports = WaveForm

},{"../common/common":2,"../utils/utils":7}],9:[function(require,module,exports){
'use strict'
const common = require('../common/common')

// default configuration of knob/gauge
const DEFAULT_XYPAD_CONFIG = {
    value: {
        x: 0.5,
        y: 0.5,
    },
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
}

const XYPad = (id, parent) => new XYPad.init(id, parent)

XYPad.init = function (id, parent) {
    if (typeof id === 'undefined') {
        throw '(XYPad) id is required'
    }

    parent = parent || window.document.body

    this.id = id
    this.ctx = null
    this.element = null
    this.subscribers = []

    this.config = Object.assign({}, DEFAULT_XYPAD_CONFIG)
    this.config.showCrossHair = false
    this.value = this.config.value

    // create canvas
    this.element = window.document.createElement('canvas')
    this.element.id = this.id
    this.ctx = this.element.getContext('2d')
    parent.appendChild(this.element)

    // (re)configure
    this.configure()

    // (pre)render
    this.render()

    // attach listener
    this.activate()
}

XYPad.prototype = {
    /**
     * @method render
     * @description (re)render knob/gauge
     * @return {Circle} this
     */
    render: function () {
        // clear
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        const top = this.ctx.canvas.height * this.value.y
        const left = this.ctx.canvas.width * this.value.x

        if (this.config.showCrossHair) {
            this.ctx.strokeStyle = '#aaa'
            this.ctx.beginPath()
            this.ctx.moveTo(0, top)
            this.ctx.lineTo(this.ctx.canvas.width, top)
            this.ctx.lineWidth = 0
            this.ctx.stroke()

            this.ctx.beginPath()
            this.ctx.moveTo(left, 0)
            this.ctx.lineTo(left, this.ctx.canvas.height)
            this.ctx.stroke()
        }

        if (this.config.showHandle) {
            this.ctx.beginPath()
            this.ctx.arc(left, top, 12, 0, 2 * Math.PI)
            this.ctx.lineWidth = 3
            this.ctx.fillStyle = 'transparent'
            this.ctx.strokeStyle = '#fc1'
            this.ctx.stroke()
            this.ctx.fill()
        }

        // trigger callback
        this.emit(this.value)
        return this
    },

    /**
     * @method configure
     * @description update configuration of knob/gauge
     * @param {object} config new (or partial) configuration
     * @returns {XYPad} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config)

        this.element.style.width = this.config.width
        this.element.style.height = this.config.height
        this.element.style.backgroundColor = '#333'
        this.element.style.boxShadow = 'inset 0 0 4px #111'
        this.element.style.marginTop = '8px'
        // this.element.style.border = '1px solid #777'
        this.element.style.boxSizing = 'border-box'
        this.element.style.borderRadius = '8px'

        this.ctx.canvas.width = this.element.clientWidth
        this.ctx.canvas.height = this.element.clientHeight
        this.value = this.config.value

        this.render()
        return this
    },

    touchDragHandler: function (event) {
        event.preventDefault()
        const clickedId = event.target.id
        const w = this.ctx.canvas.width
        const h = this.ctx.canvas.height
        const touch = this.findTouch(event)
        this.value.x = (touch.clientX - touch.target.offsetLeft) / w
        this.value.y = (touch.clientY - touch.target.offsetTop) / h

        this.element.ontouchend = (e) => {
            e.preventDefault()
            this.element.ontouchend = null
            this.element.ontouchmove = null
        }

        this.element.ontouchmove = (e) => {
            e.preventDefault()
            if (e.target.id !== clickedId) return
            const touch = this.findTouch(e)
            const w = this.ctx.canvas.width
            const h = this.ctx.canvas.height
            this.value.x = (touch.clientX - touch.target.offsetLeft) / w
            this.value.y = (touch.clientY - touch.target.offsetTop) / h
            this.render()
        }

        this.render()
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault()
        const clickedId = event.target.id
        const w = this.ctx.canvas.width
        const h = this.ctx.canvas.height

        if (event.offsetX <= w) this.value.x = event.offsetX / w
        if (event.offsetY <= h) this.value.y = event.offsetY / h

        window.document.onmouseup = (e) => {
            e.preventDefault()
            window.document.onmouseup = null
            window.document.onmousemove = null
        }

        window.document.onmousemove = (e) => {
            e.preventDefault()
            if (e.target.id !== clickedId) return
            const w = this.ctx.canvas.width
            const h = this.ctx.canvas.height
            if (e.offsetX <= w) this.value.x = e.offsetX / w
            if (e.offsetY <= h) this.value.y = e.offsetY / h
            this.render()
        }

        this.render()
    },

    findTouch: common.touch.findTouch,
    subscribe: common.events.subscribe,
    unsubscribe: common.events.unsubscribe,
    emit: common.events.emit,

    /**
     * @method deactivate
     * @description disable pad
     * @returns {XYPad} this
     */
    deactivate: function () {
        this.element.onmousedown = null
        this.element.ontouchstart = null
        return this
    },

    /**
     * @method activate
     * @description enable pad
     * @returns {XYPad} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this)
        this.element.ontouchstart = this.touchDragHandler.bind(this)
        return this
    },
}

XYPad.init.prototype = XYPad.prototype

module.exports = XYPad

},{"../common/common":2}]},{},[3])(3)
});
