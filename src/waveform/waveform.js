var waveform = (function (global) {
    "use strict";


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



})


// auto-init in browser env
if (typeof exports === 'undefined') {
    waveform(window);
}
// manual load in node env (mock window)
else {
    exports.WaveFormMock = function (window) {
        waveform(window);
    }
}
