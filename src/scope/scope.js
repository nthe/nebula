'use strict'

const Scope = (id, parent) => new Scope.init(id, parent)

Scope.init = function(id, parent) {
    if (typeof id === 'undefined') throw '(Scope) id is required'
    parent = parent || global.document.body

    this.element = global.document.createElement('canvas')
    this.element.id = id

    this.element.width = 500
    this.element.height = 55
    parent.appendChild(this.element)
    // this.run();
}

Scope.prototype = {
    run: function() {
        let that = this
        this.analyser.getByteFrequencyData(this.dataArray)
        var max = {
            src: 0,
            val: 0,
        }

        const step = (this.element.width / this.analyser.fftSize) * 2
        const ctx = this.element.getContext('2d')
        ctx.clearRect(0, 0, 500, 55)
        ctx.canvas.width = 500
        ctx.canvas.height = 55
        ctx.strokeStyle = '#aaa'
        ctx.fillStyle = '#aaa'
        ctx.lineWidth = 1
        const base = Math.log(this.dataArray.length)
        for (let index = 0; index < this.dataArray.length; index++) {
            let x = (Math.log(index) / base) * ctx.canvas.width
            let bin = this.dataArray[index]
            ctx.beginPath()
            ctx.strokeStyle = '#aaa'
            ctx.moveTo(x, 55)
            ctx.lineTo(x, 55 - (bin / 256) * 55)
            ctx.stroke()
            // ctx.beginPath()
            // ctx.strokeStyle = '#444'
            // ctx.moveTo(x, (bin / 256) * 75)
            // ctx.lineTo(x, 75)
            // ctx.stroke()
        }
        setTimeout(function() {
            that.run()
        }, 25)
    },

    init: function(context) {
        this.analyser = context.createAnalyser()
        this.analyser.connect(context.destination)
        this.analyser.fftSize = 256
        this.bufferLength = this.analyser.frequencyBinCount
        this.dataArray = new Uint8Array(this.bufferLength)
        this.analyser.getByteTimeDomainData(this.dataArray)
        return this
    },

    connect: function(source) {
        source.connect(this.analyser)
        this.analyser.connect(source.context.destination)
        return this
    },
}

Scope.init.prototype = Scope.prototype

module.exports = Scope
