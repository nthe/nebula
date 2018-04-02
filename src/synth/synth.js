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

    global.Synth = Synth;

}(window));
