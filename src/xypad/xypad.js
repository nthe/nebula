"use strict";
const common = require("../common/common");

// default configuration of knob/gauge
const DEFAULT_XYPAD_CONFIG = {
    value: {
        x: 0.5,
        y: 0.5
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
};

const XYPad = (id, parent) => new XYPad.init(id, parent);

XYPad.init = function (id, parent) {
    if (typeof id === 'undefined') {
        throw '(XYPad) id is required';
    }

    parent = parent || window.document.body;

    this.id = id;
    this.ctx = null;
    this.element = null;
    this.subscribers = [];

    this.config = Object.assign({}, DEFAULT_XYPAD_CONFIG);
    this.config.showCrossHair = true;
    this.value = this.config.value;

    // create canvas
    this.element = window.document.createElement("canvas");
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
        this.value = this.config.value;
        
        this.render();
        return this;
    },

    
    touchDragHandler: function (event) {
        event.preventDefault();
        const clickedId = event.target.id;
        const w = this.ctx.canvas.width;
        const h = this.ctx.canvas.height;
        const touch = this.findTouch(event);
        this.value.x = (touch.clientX - touch.target.offsetLeft) / w;
        this.value.y = (touch.clientY - touch.target.offsetTop) / h;
        
        this.element.ontouchend = (e) => {
            e.preventDefault();
            this.element.ontouchend = null;
            this.element.ontouchmove = null;
        };
        
        this.element.ontouchmove = (e) => {
            e.preventDefault();
            if (e.target.id !== clickedId) return;
            const touch = this.findTouch(e);
            const w = this.ctx.canvas.width;
            const h = this.ctx.canvas.height;
            this.value.x = (touch.clientX - touch.target.offsetLeft) / w;
            this.value.y = (touch.clientY - touch.target.offsetTop) / h;
            this.render();
        };
        
        this.render();
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
        
        
        if (event.offsetX <= w) this.value.x = event.offsetX / w;
        if (event.offsetY <= h) this.value.y = event.offsetY / h;

        window.document.onmouseup = (e) => {
            e.preventDefault();
            window.document.onmouseup = null;
            window.document.onmousemove = null;
        };
        
        window.document.onmousemove = (e) => {
            e.preventDefault();
            if (e.target.id !== clickedId) return;
            const w = this.ctx.canvas.width;
            const h = this.ctx.canvas.height;
            if (e.offsetX <= w) this.value.x = e.offsetX / w;
            if (e.offsetY <= h) this.value.y = e.offsetY / h;
            this.render();
        };
        
        this.render();        
    },
    
    findTouch:      common.touch.findTouch,
    subscribe:      common.events.subscribe,
    unsubscribe:    common.events.unsubscribe,
    emit:           common.events.emit,

    /**
     * @method deactivate
     * @description disable pad
     * @returns {XYPad} this
     */
    deactivate: function () {
        this.element.onmousedown = null;
        this.element.ontouchstart = null;
        return this;
    },

    /**
     * @method activate
     * @description enable pad
     * @returns {XYPad} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this);
        this.element.ontouchstart = this.touchDragHandler.bind(this);
        return this;
    }
};

XYPad.init.prototype = XYPad.prototype;

module.exports = XYPad;
