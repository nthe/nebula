(function (global) {

    global.AudioContext = (
        global.AudioContext
        || global.webkitAudioContext
        || global.mozAudioContext
        || global.oAudioContext
    );

    const context = new AudioContext();

    //global variables for sample files
    var buffer;

    //master gain node
    var master = context.createGain();
    master.connect(context.destination);

    //global varuables
    var w, h;
    var data;

    //an array that keeps the data
    var drawingdata = [];

    //an array for touch events - polyphonic
    var voices = [];

    //this will be used for mouse events - monophonic
    var voicesmono = [];

    var isloaded = false;
    var X = 0;
    var Y = 0;
    var mouseState = false;
    var helpvisible = true;

    //control initial settings
    var attack = 0.40;
    var release = 0.40;
    var density = 0.85;
    var spread = 0.2;
    var reverb = 0.5;
    var pan = 0.1;
    var trans = 1;

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
     * Grain class.
     * @constructor
     * @constructs Grain
     * @param {array} buffer audio data buffer
     * @param {number} positionx touched position
     * @param {number} positiony touched position
     * @param {number} attack attack of sound
     * @param {number} release release of sound
     * @param {number} spread spread of random offset
     * @param {number} pan spread of random pan
     * @returns {Grain} self
     */
    function Grain(buffer, positionx, positiony, attack, release, spread, pan) {

        //for scope issues
        var that = this;

        //update the time value
        this.now = context.currentTime;

        //create the source
        this.source = context.createBufferSource();
        this.source.playbackRate.value = this.source.playbackRate.value * trans;
        this.source.buffer = buffer;

        //create the gain for enveloping
        this.gain = context.createGain();

        //experimenting with adding a panner node - not all the grains will be panned for better performance
        var yes = parseInt(random(0, 3), 10);
        if (yes === 1) {
            this.panner = context.createPanner();
            this.panner.panningModel = "equalpower";
            this.panner.distanceModel = "linear";
            this.panner.setPosition(random(pan * -1, pan), 0, 0);
            
            //connections
            this.source.connect(this.panner);
            this.panner.connect(this.gain);
        } else {
            this.source.connect(this.gain);
        }

        this.gain.connect(master);

        //update the position and calcuate the offset
        this.positionx = positionx;
        this.offset = this.positionx * (buffer.duration / w); //pixels to seconds

        //update and calculate the amplitude
        this.positiony = positiony;
        this.amp = this.positiony / h;
        this.amp = map(this.amp, 0.0, 1.0, 1.0, 0.0) * 0.7;

        //parameters
        this.attack = attack * 0.4;
        this.release = release * 1.5;

        if (this.release < 0) {
            this.release = 0.1; // 0 - release causes mute for some reason
        }
        this.spread = spread;

        //in seconds
        this.randomoffset = (Math.random() * this.spread) - (this.spread / 2);

        ///envelope - parameters (when,offset,duration)
        this.source.start(this.now, this.offset + this.randomoffset, this.attack + this.release);
        this.gain.gain.setValueAtTime(0.0, this.now);
        this.gain.gain.linearRampToValueAtTime(this.amp, this.now + this.attack);
        this.gain.gain.linearRampToValueAtTime(0, this.now + (this.attack + this.release));

        //garbage collection
        this.source.stop(this.now + this.attack + this.release + 0.1);

        //calculate the time in miliseconds
        var tms = (this.attack + this.release) * 1000;
        setTimeout(function () {
            that.gain.disconnect();
            if (yes === 1) {
                that.panner.disconnect();
            }
        }, tms + 200);
    }


    /**
     * Voice class.
     * @constructor
     * @constructs Voice.init
     * @param {object} id unique identifier of voice
     * @returns {Voice.init} self
     */
    const Voice = (id) => new Voice.init(id);

    /**
     * Voice class.
     * @constructor
     * @constructs Voice.init
     * @param {object} id unique identifier of voice
     * @returns {Voice.init} self
     */
    Voice.init = function (id) {
        this.touchid = id;
    }

    Voice.prototype = {

        //play function for mouse event
        playmouse: function (event) {
            this.grains = [];
            this.grainscount = 0;

            //for scope issues	
            var that = this;

            this.play = function () {
                //create new Grain
                var g = new Grain(buffer, event.offsetX, event.offsetY, attack, release, spread, pan);

                //push to the array
                that.grains[that.graincount] = g;
                that.graincount += 1;

                if (that.graincount > 20) {
                    that.graincount = 0;
                }

                //next interval
                this.dens = map(density, 1, 0, 0, 1);
                this.interval = (this.dens * 500) + 70;
                that.timeout = setTimeout(that.play, this.interval);
            };

            this.play();
        },

        //play function for touch events - this will get the position from touch events
        playtouch: function (positionx, positiony) {
            //this.positiony = positiony;
            this.positionx = positionx;
            this.positiony = positiony;
            this.grains = [];
            this.graincount = 0;

            //for scope issues	
            var that = this;

            this.play = function () {
                //create new Grain
                var g = new Grain(buffer, that.positionx, that.positiony, attack, release, spread, pan);

                //push to the array
                that.grains[that.graincount] = g;
                that.graincount += 1;

                if (that.graincount > 30) {
                    that.graincount = 0;
                }
                //next interval
                this.dens = map(density, 1, 0, 0, 1);
                this.interval = (this.dens * 500) + 70;
                that.timeout = setTimeout(that.play, this.interval);
            };

            this.play();
        },

        //stop method
        stop: function () {
            clearTimeout(this.timeout);
        }
    };

    Voice.init.prototype = Voice.prototype;

    global.Voice = Voice;


    //loading the first sound with XML HTTP REQUEST
    var request = new XMLHttpRequest();
    request.open('GET', 'audio/guitar.mp3', true);
    request.responseType = "arraybuffer";
    request.onload = function () {
        context.decodeAudioData(request.response, function (b) {
            buffer = b; //set the buffer
            data = buffer.getChannelData(0);
            isloaded = true;
            var canvas1 = document.getElementById('canvas');
            //initialize the processing draw when the buffer is ready
            var processing = new Processing(canvas1, waveformdisplay);

        }, function () {
            console.log('loading failed')
        });
    };
    request.send();


    //drop
    var drop = document.getElementById('waveform');

    drop.addEventListener("dragover", function (e) {
        //prevents from loading the file in a new page
        e.preventDefault();
    }, false);

    drop.addEventListener('drop', function (e) {
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var array = e.target.result;
            context.decodeAudioData(array, function (b) {

                buffer = b
                data = buffer.getChannelData(0);
                var canvas1 = document.getElementById('canvas');
                var processing = new Processing(canvas1, waveformdisplay);
                load();

            }, function () {
                console.log('loading failed');
                alert('loading failed');
            });
        }
        reader.readAsArrayBuffer(file);
    }, false);

}(window));
