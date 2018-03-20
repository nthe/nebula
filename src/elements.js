var elements = (function (global) {


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
    Label.init = function(id, parent) {
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






    // default configuration of knob/gauge
    const DEFAULT_CIRCLE_CONFIG = {
        value: 0.5,
        radius: 120,
        lineWidth: 10,
        handleRadius: 8,
        sweepAngle: 180,
        startAngle: 180,
        rangeColor: '#0af',
        indicatorColor: '#fc1',
        backdropColor: '#424242',
        rounded: true,
        showHandle: false
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
    Circle.init = function(id, parent) {
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
            this.ctx.lineWidth = this.config.lineWidth - 8;
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

            if(this.config.showHandle) {
                this.ctx.beginPath();
                this.ctx.lineWidth = this.config.handleRadius;
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
            let initX = event.clientX;
            let initY = event.clientY;

            global.document.onmouseup = (e) => {
                e.preventDefault();
                global.document.onmouseup = null;
                global.document.onmousemove = null;
            };
            
            global.document.onmousemove = (e) => {
                e.preventDefault();
                if (e.clientY > initY) {
                    this.value -= 0.03;
                } else {
                    this.value += 0.03;
                }
                initY = e.clientY;
                initX = e.clientX;
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
    Slider.init = function(id, parent) {
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
        get handleDiameter () {
            return this.config.handleRadius * 2;
        },

        get totalWidth () {
            if(this.config.vertical) {
                return Math.max(this.handleDiameter, this.config.lineWidth);
            } else {
                return this.handleDiameter + this.config.width;
            }
        },

        get totalHeight () {
            if(this.config.vertical) {
                return this.handleDiameter + this.config.width;
            } else {
                return Math.max(this.handleDiameter, this.config.lineWidth);
            }
        },

        get sliderMinX () {
            return this.config.handleRadius;
        },

        get sliderMaxX () {
            return this.totalWidth - this.config.handleRadius;
        },

        get sliderMinY () {
            return this.config.handleRadius;
        },

        get sliderMaxY () {
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

            if(this.config.showHandle) {
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

            if(this.config.showHandle) {
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
            if(this.config.vertical) {
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
                if(this.config.vertical) {
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
        onChange: ((value, displayValue, self) => {}),

        /**
         * @method subscribe
         * @description register callback for subscription
         * @param {function} callback callback method
         * @returns {Slider} this
         */
        subscribe: function (callback) {
            if(!this.subscribers.indexOf(callback) < 0) {
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
