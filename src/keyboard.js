const keyboard = (function (global) {

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
    KeyBoard.init = function (octave = 2, velocity = 100) {
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
                    this.emit({ ...note, voice: voice, freq: this.noteToFreq(note), state: 'on' });
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
                    this.emit({ ...note, voice: heldKey, freq: this.noteToFreq(note), state: 'off' });
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

    global.KeyBoard = KeyBoard;

});


// auto-init in browser env
if (typeof exports === 'undefined') {
    keyboard(window);
} 
// manual load in node env (mock window)
else {
    exports.KeyBoardMock = function (window) {
        keyboard(window);
    } 
}
