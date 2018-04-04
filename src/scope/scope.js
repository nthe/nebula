var scope_module = (function (global) {
    "use strict";
    
    const Scope = (id, parent) => new Scope.init (id, parent);

    Scope.init = function (id, parent) {
        if (typeof id === 'undefined') throw '(Scope) id is required';
        parent = parent || global.document.body;
        
        this.element = global.document.createElement('canvas');
        this.element.id = id;

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
            for (let index = 0; index < this.dataArray.length; index++) {
                const element = Math.pow(this.dataArray[index], 2);
                if (element > max.src){
                    max.val = this.dataArray[index];
                    max.src = element;
                } 
            }
            
            console.log('...', this.element.id, max.val, this.analyser.context.sampleRate, this.analyser.context.sampleRate / max.val);
            setTimeout(function () {
                that.run();
            }, 2000);
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
        },

    };

    Scope.init.prototype = Scope.prototype;

    global.Scope = Scope;

})


// auto-init in browser env
if (typeof exports === 'undefined') {
    scope_module(window);
}
// manual load in node env (mock window)
else {
    exports.ScopeMock = function (window) {
        scope_module(window);
    }
}
