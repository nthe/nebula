"use strict";

const Scope = (id, parent) => new Scope.init (id, parent);

Scope.init = function (id, parent) {
    if (typeof id === 'undefined') throw '(Scope) id is required';
    parent = parent || global.document.body;
    
    this.element = global.document.createElement('canvas');
    this.element.id = id;

    this.element.width = 500;
    this.element.height - 125;
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
        
        const step = (this.element.width / this.analyser.fftSize) * 2;
        const ctx = this.element.getContext('2d');
        ctx.clearRect(0, 0, 500, 125);
        ctx.canvas.width = 500;
        ctx.canvas.height = 125;
        ctx.strokeStyle = "#aaa";
        ctx.fillStyle = "#aaa";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let index = 0; index < this.dataArray.length; index++) {
            let bin = this.dataArray[index]
            ctx.moveTo(step * index, 0);
            ctx.lineTo(step * index, ((bin / 256) * 125));   
        }
        ctx.stroke();
        setTimeout(function () {
            that.run();
        }, 25);
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
        return this;
    },

};

Scope.init.prototype = Scope.prototype;

module.exports = Scope;
