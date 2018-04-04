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
