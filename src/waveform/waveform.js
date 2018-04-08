"use strict";
var utils = require('../utils/utils');

const DEFAULT_WAVEFORM_CONFIG = {
    width: 500,
    height: 125,
    strokeColor: '#fff',
    indicatorColor: '#fc1'
};

const WaveForm = (id, parent) => new WaveForm.init(id, parent);

WaveForm.init = function (id, parent) {
    this.element = window.document.createElement('div');
    this.backdrop = window.document.createElement('canvas');
    this.front = window.document.createElement('canvas');
    this.element.style.width = "500px";
    this.element.style.height = "125px";
    this.backdrop.getContext('2d').canvas.width = 500;
    this.backdrop.getContext('2d').canvas.height = 125;
    this.front.getContext('2d').canvas.width = 500;
    this.front.getContext('2d').canvas.height = 125;

    this.backdrop.style.position = 'absolute';
    this.backdrop.style.margin = '0';
    this.front.style.position = 'absolute';
    this.front.style.backgroundColor = 'transparent';
    this.front.style.margin = '0';
    this.backdrop.id = `${id}-backdrop`;
    this.front.id = `${id}-front`;
    this.element.id = id;
    
    this.config = Object.assign({}, DEFAULT_WAVEFORM_CONFIG);
    this.element.style.minWidth = this.config.width;
    this.element.style.minHeight = this.config.height;

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
        //draw the buffer
        var step = Math.ceil(data.length / w);
        var amp = h / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.translate(0.5, 0.5);

        ctx.strokeStyle = this.config.strokeColor;

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
        fctx.strokeStyle = this.config.indicatorColor;
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

        window.document.onmouseup = (e) => {
            e.preventDefault();
            window.document.onmouseup = null;
            window.document.onmousemove = null;
        };

        window.document.onmousemove = (e) => {
            e.preventDefault();
            if (e.target.id !== clickedId) return;
            const w = this.backdrop.width;
            if (e.offsetX <= w) this.value = e.offsetX / w;
            this.render();
        };
    },

    load: function (url, callback) {
        var request = new window.XMLHttpRequest();
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

    deactivate: function () {
        this.element.removeEventListener('dragover', this.dragOverHandler.bind(this), false);
        this.element.removeEventListener('drop', this.dropHandler.bind(this), false);
        this.element.onmousedown = null
    },

    activate: function () {
        this.element.addEventListener('dragover', this.dragOverHandler.bind(this), false);
        this.element.addEventListener('drop', this.dropHandler.bind(this), false);
        this.element.onmousedown = this.mouseDragHandler.bind(this);
    }
};

WaveForm.init.prototype = WaveForm.prototype;

module.exports = WaveForm;
