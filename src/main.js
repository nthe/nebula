window.AudioContext = (
    window.AudioContext
    || window.webkitAudioContext
    || window.mozAudioContext
    || window.oAudioContext
);

const context = new AudioContext();

const tutorial = document.querySelector('.tutorial');
const synth = Synth(context);
const wave = WaveForm('elements-waveform-1', tutorial);
const xypad = XYPad('elements-xypad-3', tutorial)
    .configure({
        width: 500,
        height: 200
    });

const xypad2 = XYPad('elements-xypad-4', tutorial)
     .configure({
        width: 200,
        height: 200
    });
xypad2.element.style.marginLeft = 8;

const scope = Scope('elements-scope', tutorial);
const key = KeyBoard();

scope.init(context).connect(synth.master);

wave.load('audio/sample2.wav', function (buffer) {
    synth.buffer = buffer;
});

xypad.subscribe({
    update: function (data) {
        synth.controls.offset = data.x;
        synth.controls.amp = 1 - Math.pow(data.y, 2);
    }
});

xypad2.subscribe({
    update: function (data) {
        synth.controls.density = data.x * 100;
        synth.controls.spread = 1 - data.y;
    }
});

xypad.subscribe({
    update: function (data) {
        wave.value = data.x;
        wave.render();
    }
});

key.subscribe(synth);      