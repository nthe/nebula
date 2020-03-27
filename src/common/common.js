'use strict'

/**
 * @method subscribe
 * @description register callback for subscription
 * @param {function} callback callback method
 * @returns {object} this
 */
function subscribe(callback) {
    console.log(this)
    this.subscribers = this.subscribers || []
    if (!this.subscribers.indexOf(callback) < 0) {
        return
    }
    callback.update(this.value)
    this.subscribers.push(callback)
    return this
}

/**
 * @method unsubscribe
 * @description un-register callback from subscription
 * @param {function} callback callback method
 * @returns {object} this
 */
function unsubscribe(callback) {
    let position = this.subscribers.indexOf(callback)
    if (position < 0) {
        return
    }
    this.subscribers.splice(position, 1)
    return this
}

/**
 * @method emit
 * @description calls callbacks of subscribers
 * @param {any} data data to publish
 * @returns {any} data
 */
function emit(data) {
    this.subscribers.map(f => f.update(data))
    return data
}

/**
 * @method findTouch
 * @description get touch event on given elements
 * @param {Event} [event] raised event
 * @returns {Event} touch event
 */
const findTouch = function(event) {
    if (!event.touches.length) return
    const touches = []
    for (let touch of event.touches) {
        if (touch.target.id === this.element.id) touches.push(touch)
    }
    return touches.length ? touches[0] : null
}

/**
 * Define exports for module.
 */
module.exports = {
    events: { subscribe, unsubscribe, emit },
    touch: { findTouch },
}
