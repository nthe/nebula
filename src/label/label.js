var label_module = (function (global) {
    "use strict";

    const DEFAULT_LABEL_CONFIG = {
        value: 0.5,
        color: '#ddd',
        fontSize: 24,
        fontFamily: 'Lucida Console',
    };

    /**
     * @constructor
     * @constructs Label
     * @description function construction
     * @param {string} id identifier of new element
     * @param {HTMLElement} parent host of new element
     */
    const Label = function (id, parent) {
        return new Label.init(id, parent);
    }

    /**
     * @constructor
     * @constructs Label
     * @description function constructor
     * @param {string} id identifier of new element
     * @param {HTMLElement} parent host of new element
     */
    Label.init = function (id, parent) {

        if (typeof id === 'undefined') {
            throw '(Label) id is required';
        }

        parent = parent || global.document.body;

        this.id = id;
        this.element = null;
        this.displayValue = null;

        this.config = Object.assign({}, DEFAULT_LABEL_CONFIG);

        this.value = this.config.value;

        // create canvas
        this.element = global.document.createElement("span");
        this.element.style.position = 'absolute';
        this.element.style.pointerEvents = 'none';
        this.element.id = this.id;
        parent.appendChild(this.element);

        // (re)configure
        this.configure({});

        // (pre)render
        this.render();
    }

    Label.prototype = {

        /**
         * @method
         * @description transformation function for display purposes
         * @returns {number}
         */
        transformer: ((value) => value.toFixed(2)),

        /**
         * @method render
         * @description (re)render label
         * @return {Label} this
         */
        render: function () {
            this.element.innerHTML = this.transformer(this.value);
            return this;
        },

        /**
         * @method configure
         * @description update configuration of knob/gauge
         * @param {object} config new (or partial) configuration
         * @returns {Circle} this
         */
        configure: function (config) {
            this.config = Object.assign(this.config, config);
            this.value = this.config.value;
            this.element.style.fontFamily = this.config.fontFamily;
            this.element.style.fontSize = this.config.fontSize;
            this.element.style.color = this.config.color;
            this.render();
            return this;
        },

        /**
         * @method update
         * @description update value/progress
         * @param {number} value new value
         * @return {Label} this
         */
        update: function (value) {
            this.value = value;
            this.render();
            return this;
        },
    };

    Label.init.prototype = Label.prototype;

    global.Label = Label;

})


// auto-init in browser env
if (typeof exports === 'undefined') {
    label_module(window);
}
// manual load in node env (mock window)
else {
    exports.LabelMock = function (window) {
        label_module(window);
    }
}
