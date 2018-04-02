var elements = (function (global) {
    "use strict";

    // global.AudioContext = (
    //     global.AudioContext
    //     || global.webkitAudioContext
    //     || global.mozAudioContext
    //     || global.oAudioContext
    // );


    // const context = global.CONTEXT || new global.AudioContext();
    
    
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

    global.Label = Label;









    const WaveForm = (id, parent) => new WaveForm.init(id, parent);

    WaveForm.init = function (id, parent) {
        this.element = global.document.createElement('div');
        this.backdrop = global.document.createElement('canvas');
        this.front = global.document.createElement('canvas');

        this.backdrop.style.position = 'absolute';
        this.backdrop.style.margin = '0';
        this.front.style.position = 'absolute';
        this.front.style.backgroundColor = 'transparent';
        this.front.style.margin = '0';
        this.backdrop.id = `${id}-backdrop`;
        this.front.id = `${id}-front`;
        this.element.id = id;
        
        this.element.style.minWidth = 800; //this.backdrop.clientWidth;
        this.element.style.minHeight = 125;//this.backdrop.clientHeight;

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
            // ctx.lineCap = 'round';
            // ctx.lineWidth = 0.5;
            //draw the buffer
            var step = Math.ceil(data.length / w);
            var amp = h / 2;

            ctx.clearRect(0, 0, w, h);
            ctx.translate(0.5, 0.5);

            ctx.strokeStyle = "#fff";

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
            fctx.strokeStyle = "#fc1";
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

            global.document.onmouseup = (e) => {
                e.preventDefault();
                global.document.onmouseup = null;
                global.document.onmousemove = null;
            };

            global.document.onmousemove = (e) => {
                e.preventDefault();
                if (e.target.id !== clickedId) return;
                const w = this.backdrop.width;
                // const h = this.ctx.canvas.height;
                if (e.offsetX <= w) this.value = e.offsetX / w;
                // if (e.offsetY <= h) this.value.y = e.offsetY / h;
                this.render();
            };
        },

        load: function (url, callback) {
            var request = new global.XMLHttpRequest();
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

        activate: function () {
            this.element.addEventListener('dragover', this.dragOverHandler.bind(this), false);
            this.element.addEventListener('drop', this.dropHandler.bind(this), false);
            this.element.onmousedown = this.mouseDragHandler.bind(this);
        }

    };

    WaveForm.init.prototype = WaveForm.prototype;

    global.WaveForm = WaveForm;














    const XYPad = (id, parent) => new XYPad.init(id, parent);

    XYPad.init = function (id, parent) {
        if (typeof id === 'undefined') {
            throw '(XYPad) id is required';
        }

        parent = parent || global.document.body;

        this.id = id;
        this.ctx = null;
        this.element = null;
        this.subscribers = [];

        this.config = Object.assign({}, DEFAULT_CIRCLE_CONFIG);
        this.config.showCrossHair = true;
        this.value = { x: 0.75  , y: 0.62 };

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
            
            if (event.type === 'touchstart') {
                const touch = event.touches[0];
                this.value.x = (touch.clientX - touch.target.offsetLeft) / w;
                this.value.y = (touch.clientY - touch.target.offsetTop) / h;
                
                global.document.ontouchend = (e) => {
                    e.preventDefault();
                    global.document.ontouchstart = null;
                    global.document.ontouchmove = null;
                };
                
                global.document.ontouchmove = (e) => {
                    // e.preventDefault();
                    if (e.target.id !== clickedId) return;
                    const touch = e.touches[0];
                    const w = this.ctx.canvas.width;
                    const h = this.ctx.canvas.height;
                    this.value.x = (touch.clientX - touch.target.offsetLeft) / w;
                    this.value.y = (touch.clientY - touch.target.offsetTop) / h;
                    this.render();
                };

            } else {
                if (event.offsetX <= w) this.value.x = event.offsetX / w;
                if (event.offsetY <= h) this.value.y = event.offsetY / h;

                global.document.onmouseup = (e) => {
                    e.preventDefault();
                    global.document.onmouseup = null;
                    global.document.onmousemove = null;
                };
    
                global.document.onmousemove = (e) => {
                    e.preventDefault();
                    if (e.target.id !== clickedId) return;
                    const w = this.ctx.canvas.width;
                    const h = this.ctx.canvas.height;
                    if (e.offsetX <= w) this.value.x = e.offsetX / w;
                    if (e.offsetY <= h) this.value.y = e.offsetY / h;
                    this.render();
                };
    
            }

            this.render();
            
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
         * @returns {XYPad} this
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
         * @returns {XYPad} this
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
         * @description disable pad
         * @returns {XYPad} this
         */
        deactivate: function () {
            this.element.onmousedown = null;
            return this;
        },

        /**
         * @method activate
         * @description enable pad
         * @returns {XYPad} this
         */
        activate: function () {
            this.element.onmousedown = this.mouseDragHandler.bind(this);
            this.element.ontouchstart = this.mouseDragHandler.bind(this);
            return this;
        }
    };

    XYPad.init.prototype = XYPad.prototype;

    global.XYPad = XYPad;













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

        parent = parent || global.document.body;

        this.id = id;
        this.ctx = null;
        this.element = null;
        this.subscribers = [];

        this.config = Object.assign({}, DEFAULT_CIRCLE_CONFIG);

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

            global.document.onmouseup = (e) => {
                e.preventDefault();
                global.document.onmouseup = null;
                global.document.onmousemove = null;
            };

            global.document.onmousemove = (e) => {
                e.preventDefault();
                if (e.clientY > initY) {
                    this.value -= 0.003;
                } else {
                    this.value += 0.003;
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
    global.Circle = Circle;





















































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
            this.subscribers.map(f => f(data));
            return data;
        },

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

    global.Slider = Slider;

})


// auto-init in browser env
if (typeof exports === 'undefined') {
    elements(window);
}
// manual load in node env (mock window)
else {
    exports.ElementsMock = function (window) {
        elements(window);
    }
}
