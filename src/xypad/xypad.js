var xypad_module = (function (global) {
    "use strict";

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

        parent = parent || global.document.body;

        this.id = id;
        this.ctx = null;
        this.element = null;
        this.subscribers = [];

        this.config = Object.assign({}, DEFAULT_XYPAD_CONFIG);
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

})


// auto-init in browser env
if (typeof exports === 'undefined') {
    xypad_module(window);
}
// manual load in node env (mock window)
else {
    exports.XYPadMock = function (window) {
        xypad_module(window);
    }
}
