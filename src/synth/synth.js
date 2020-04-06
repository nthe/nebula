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
