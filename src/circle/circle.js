const common = require('../common/common')
const utils = require('../utils/utils')
;('use strict')

// default configuration of knob/gauge
const DEFAULT_CIRCLE_CONFIG = {
    value: 0.18,
    radius: 64,
    lineWidth: 3,
    startAngle: 180,
    sweepAngle: 360,
    backdropPadding: 4,
    showHandle: false,
    handleRadius: 2,
    handleColor: '#333',
    rangeColor: '#1cf',
    backdropColor: '#424242',
    indicatorColor: '#333',
    rounded: true,
}

/**
 * @function toRadians
 * @description convert angle from degrees to radians
 * @param {number} degrees angle in degress
 */
const toRadians = (degrees) => degrees * (Math.PI / 180)

/**
 * @constructor
 * @constructs Circle
 * @description function construction
 * @param {string} id identifier of new element
 * @param {HTMLElement} parent host of new element
 */
const Circle = function (id, parent) {
    return new Circle.init(id, parent)
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
        throw '(Circle) id is required'
    }

    this.parent = parent || window.document.body

    this.id = id
    this.ctx = null
    this.element = null
    this.subscribers = []

    this.config = Object.assign({}, DEFAULT_CIRCLE_CONFIG)

    this.value = this.config.value

    // create canvas
    this.element = window.document.createElement('canvas')
    this.element.id = this.id
    this.ctx = this.element.getContext('2d')
    this.parent.appendChild(this.element)

    // (re)configure
    this.configure()

    // (pre)render
    this.render()

    // attach listener
    this.activate()
}

Circle.prototype = {
    /**
     * @method addLabel
     * @description add label to knob
     * @param {string} text label text
     * @returns {Circle} this
     */
    addLabel: function (text) {
        const label = document.createElement('p')
        label.innerText = text
        label.style.position = 'absolute'
        label.style.color = '#888'
        label.style.top = this.element.offsetTop + 15
        label.style.fontSize = '.7rem'
        this.parent.appendChild(label)
        return this
    },

    /**
     * @method render
     * @description (re)render knob/gauge
     * @return {Circle} this
     */
    render: function () {
        // clear
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

        let size = this.ctx.canvas.width / 2
        let angle =
            toRadians(this.config.sweepAngle) * this.value +
            toRadians(this.config.startAngle)

        // backdrop
        this.ctx.lineWidth = this.config.lineWidth
        this.ctx.strokeStyle = this.config.backdropColor
        this.ctx.beginPath()
        this.ctx.arc(
            size,
            size,
            size - this.config.lineWidth / 2,
            toRadians(this.config.startAngle) - 0.04,
            toRadians(this.config.startAngle + this.config.sweepAngle) + 0.04
        )
        this.ctx.stroke()

        // value indicator
        this.ctx.lineWidth =
            this.config.lineWidth - this.config.backdropPadding * 2
        this.ctx.strokeStyle = this.config.rangeColor
        this.ctx.beginPath()
        this.ctx.arc(
            size,
            size,
            size - this.config.lineWidth / 2,
            toRadians(this.config.startAngle),
            angle
        )
        this.ctx.stroke()

        if (this.config.showHandle) {
            this.ctx.beginPath()
            this.ctx.lineWidth = this.config.handleRadius * 2
            this.ctx.arc(
                size,
                size,
                size - this.config.lineWidth / 2,
                angle - 0.01,
                angle + 0.01
            )
            this.ctx.strokeStyle = this.config.indicatorColor
            this.ctx.stroke()
        }

        // trigger callbacks
        // this.onChange(this.value, this);
        this.emit(this.value)
        return this
    },

    /**
     * @method configure
     * @description update configuration of knob/gauge
     * @param {object} config new (or partial) configuration
     * @returns {Circle} this
     */
    configure: function (config) {
        this.config = Object.assign(this.config, config)
        this.value = this.config.value
        this.element.width = this.config.radius
        this.element.height = this.config.radius
        this.ctx.canvas.width = this.element.clientWidth
        this.ctx.canvas.height = this.element.clientHeight
        this.ctx.lineCap = this.config.rounded ? 'round' : 'butt'
        this.render()
        return this
    },

    /**
     * @method mouseDragHandler
     * @description process mouse drag event
     * @param {MouseEvent} event mouse event
     */
    mouseDragHandler: function (event) {
        event.preventDefault()

        window.onmouseup = (e) => {
            e.preventDefault()
            window.onmouseup = null
            window.onmousemove = null
        }

        window.onmousemove = (e) => {
            e.preventDefault()
            this.value -= e.movementY / 200
            this.value = utils.limitTo(this.value, 0, 1)
            this.render()
        }
    },

    /**
     * @method setValue
     * @description update value/progress
     * @param {number} value new value
     * @return {Circle} this
     */
    setValue: function (value) {
        this.value = value
        this.render()
        return this
    },

    subscribe: common.events.subscribe,
    unsubscribe: common.events.unsubscribe,
    emit: common.events.emit,

    /**
     * @method deactivate
     * @description disable knob/gauge
     * @returns {Circle} this
     */
    deactivate: function () {
        this.element.onmousedown = null
        return this
    },

    /**
     * @method activate
     * @description enable knob/gauge
     * @returns {Circle} this
     */
    activate: function () {
        this.element.onmousedown = this.mouseDragHandler.bind(this)
        return this
    },

    /**
     * @method withLabel
     * @description rendered centered label
     * @returns {Circle} this;
     */
    withLabel: function (text, top = 100, size = 11) {
        const label = document.createElement('p')
        label.classList.add('label')
        label.innerText = text
        // console.log(label, this.element.offsetTop)
        label.style.top = top
        label.style.fontSize = size
        this.parent.appendChild(label)
        return this
    },
}

// configure prototype chain
Circle.init.prototype = Circle.prototype

// expose api
module.exports = Circle
