window.AudioContext = (
    window.AudioContext
    || window.webkitAudioContext
    || window.mozAudioContext
    || window.oAudioContext
);

// console.log(window);
const context = new AudioContext();

const tutorial = document.querySelector('#panel');
const left_controls = document.querySelector('.amp-envelope');
const filt_controls = document.querySelector('.filter-controls');
const convolver = document.querySelector('.convolver');
const right_controls = document.querySelector('#right-controls');


const synth = ELM.Synth(context);
const skew = ELM.GUI.Circle('cir7', left_controls).configure({radius: 120, lineWidth: 16, rangeColor: '#1cf', backdropColor: '#424242'});
const release = ELM.GUI.Circle('cir2', left_controls).configure({radius: 52, lineWidth: 4, value: 0.1, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
const decay = ELM.GUI.Circle('cir3', left_controls).configure({radius: 72, lineWidth: 8, rangeColor: '#1cf', backdropColor: '#424242'});
const attack = ELM.GUI.Circle('cir', left_controls).configure({radius: 72, lineWidth: 8, value: 0.05, rangeColor: '#1cf', backdropColor: '#424242'});

const q = ELM.GUI.Circle('cir5', filt_controls).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
const gain = ELM.GUI.Circle('cir4', filt_controls).configure({radius: 92, lineWidth: 14, rangeColor: '#1cf', backdropColor: '#424242'});
const freq = ELM.GUI.Circle('cir6', filt_controls).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

const c1 = ELM.GUI.Circle('cir8', convolver).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
const c2 = ELM.GUI.Circle('cir9', convolver).configure({radius: 92, lineWidth: 14, rangeColor: '#1cf', backdropColor: '#424242'});
const c3 = ELM.GUI.Circle('cir10', convolver).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
// ELM.GUI.Circle('cir4', left_controls).configure({radius: 80, lineWidth: 4, rangeColor: '#fff', backdropColor: '#333'});
// ELM.GUI.Circle('cir5', left_controls);
// ELM.GUI.Circle('cir6', left_controls);
const wave = ELM.GUI.WaveForm('elements-waveform-1', tutorial);
const xypad = ELM.GUI.XYPad('elements-xypad-3', tutorial)
    .configure({
        width: 500,
        height: 125
    });

const xypad2 = ELM.GUI.XYPad('elements-xypad-4', tutorial)
     .configure({
        width: 500,
        height: 225
    });
xypad2.element.style.marginLeft = 8;

// const scope = Scope('elements-scope', tutorial);
const key = ELM.KeyBoard();

// scope.init(context).connect(synth.master);

wave.load('audio/foley.wav', function (buffer) {
    synth.buffer = buffer;
});

xypad.subscribe({
    update: function (data) {
        synth.controls.offset = data.x;
        // synth.controls.amp = 1 - Math.pow(data.y, 2);
        synth.controls.trans = Math.pow(1.5 - data.y, 3);
    }
});

xypad2.subscribe({
    update: function (data) {
        synth.controls.density = data.x * 100;
        synth.controls.spread = 1 - data.y;
    }
});

attack.subscribe({
    update: function (data) {
        synth.controls.attack = data;
    }
});

release.subscribe({
    update: function (data) {
        synth.controls.release = data;
    }
});

decay.subscribe({
    update: function (data) {
        synth.controls.decay = data;
    }
});

xypad.subscribe({
    update: function (data) {
        wave.value = data.x;
        wave.render();
    }
});

key.subscribe(synth);      