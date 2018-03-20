var slider = (function (global) {

    // default configuration of slider
    const DEFAULT_CONFIG = {
        value: 0.5,
        width: 120,
        lineWidth: 14,
        fontSize: 14,
        fontColor: '#eee',
        fontFamily: 'segoe ui',
        rangeColor: '#0af',
        indicatorColor: '#fc1',
        backdropColor: '#424242',
        showHandle: false,
        handleRadius: 12
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

        this.config = Object.assign({}, DEFAULT_CONFIG);
        
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

        },

        get totalHeight () {
            return this.handleDiameter + Math.max(this.config.labelSize, this.config.valueSize);
        },

        get sliderMaxX () {
            return this.totalWidth - this.handleRadius;
        },
        
        /**
         * @method render
         * @description (re)render slider
         * @return {Slider} this
         */
        render: function () {       
            // clear
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            
            let size = this.ctx.canvas.width / 2;
            let progress = this.value * this.config.width;
            
            // display text
            this.ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
            this.ctx.fillStyle = this.config.fontColor;
            this.ctx.textAlign = "right";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(
                this.displayFunction().toFixed(0), 
                this.ctx.canvas.width,
                20 + size / 2 - 4
            );
            this.ctx.font = `${12}px ${this.config.fontFamily}`;
            this.ctx.textAlign = "left";
            this.ctx.fillStyle = '#777';
            this.ctx.fillText(
                'Slider', 
                0,
                20 + size / 2 - 4
            );
            // backdrop
            this.ctx.lineWidth = this.config.lineWidth;
            this.ctx.strokeStyle = this.config.backdropColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 20);
            this.ctx.lineTo(150, 20);
            this.ctx.stroke();

            // value indicator
            this.ctx.lineWidth = this.config.lineWidth - 4;
            this.ctx.strokeStyle = this.config.rangeColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 20);
            this.ctx.lineTo(progress, 20);
            this.ctx.stroke();

            this.ctx.lineWidth = this.config.lineWidth - 4;
            this.ctx.strokeStyle = this.config.indicatorColor;
            this.ctx.beginPath();
            this.ctx.moveTo(progress - 2, 20);
            this.ctx.lineTo(progress, 20);
            this.ctx.stroke();

            if(this.config.showHandle) {
                this.ctx.fillStyle = '#fff';//this.config.rangeColor;
                this.ctx.beginPath();
                this.ctx.arc(progress, 20, this.config.handleRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            // trigger callbacks
            this.onChange(this.value, this.displayValue, this);

            return this;
        },

        /**
         * @method configure
         * @description update configuration of slider
         * @param {object} config new (or partial) configuration
         * @returns {Slider} this
         * 
         * 
         * CONSTRAINTS:
         *  - handleDiameter must be at least lineWidth
         *
         * handleRadius = handleDiameter / 2
         * totalWidth   = handleDiameter + width
         * totalHeight  = handleDiameter + offset + Math.max(labelSize, valueSize)
         * minX         = handleRadius
         * maxX         = totalWidth - handleRadius
         * y            = handleRadius
         */
        configure: function (config) {
            this.config = Object.assign(this.config, config);
            this.value = this.config.value;
            this.element.width = this.config.width;
            this.element.height = this.config.width;
            this.ctx.canvas.width = this.element.clientWidth;
            this.ctx.canvas.height = this.element.clientHeight;
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
            let initX = event.clientX;
            let initY = event.clientY;

            global.document.onmouseup = (e) => {
                e.preventDefault();
                global.document.onmouseup = null;
                global.document.onmousemove = null;
            };
            
            global.document.onmousemove = (e) => {
                e.preventDefault();

                let off = this.ctx.canvas.getBoundingClientRect().x;
                this.value = ((e.clientX - off) / this.config.width);
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
    slider(window);
} 
// manual load in node env (mock window)
else {
    exports.SliderMock = function (window) { slider(window); };
}
