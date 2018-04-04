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
const samples_list = document.querySelector('.samples-list');

for (let sample of ['chair-1', 'chair-2', 'chair-3', 'doors-1', 'glasses-1', 'gun-reload', 'metal-can-1', 'metallic-1']) {
    const li = document.createElement('li');
    li.innerHTML = sample;
    samples_list.appendChild(li);
}

samples_list.addEventListener('click', (event) => {
    const sample = `audio/${event.target.innerHTML}.wav`;
    for (let el of samples_list.children) {
        el.style.color = "#424242";
    }
    event.target.style.color = "#fc1";
    wave.load(sample, function (buffer) {
        synth.buffer = buffer;
    });
    wave.load(sample, function (buffer) {
        synth.buffer = buffer;
    });
});

const synth = ELM.Synth(context);
const skew = ELM.GUI.Circle('cir7', left_controls).configure({radius: 120, lineWidth: 16, rangeColor: '#1cf', backdropColor: '#424242'});
const release = ELM.GUI.Circle('cir2', left_controls).configure({radius: 52, lineWidth: 4, value: 0.25, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
const decay = ELM.GUI.Circle('cir3', left_controls).configure({radius: 72, lineWidth: 8, value: 0.33, rangeColor: '#1cf', backdropColor: '#424242'});
const attack = ELM.GUI.Circle('cir', left_controls).configure({radius: 72, lineWidth: 8, value: 0.15, rangeColor: '#1cf', backdropColor: '#424242'});

const q = ELM.GUI.Circle('cir5', filt_controls).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
const gain = ELM.GUI.Circle('cir4', filt_controls).configure({radius: 92, lineWidth: 14, rangeColor: '#1cf', backdropColor: '#424242'});
const freq = ELM.GUI.Circle('cir6', filt_controls).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

const c1 = ELM.GUI.Circle('cir8', convolver).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});
const c2 = ELM.GUI.Circle('cir9', convolver).configure({radius: 92, lineWidth: 14, rangeColor: '#1cf', backdropColor: '#424242'});
const c3 = ELM.GUI.Circle('cir10', convolver).configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});


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
xypad2.value.x = 0.8;
xypad2.value.y = 0.2;
xypad2.element.style.marginLeft = 8;

// const scope = Scope('elements-scope', tutorial);
const key = ELM.KeyBoard();

// scope.init(context).connect(synth.master);

wave.load('audio/gun-reload.wav', function (buffer) {
    synth.buffer = buffer;
    samples_list.children[5].style.color = "#fc1";
});

xypad.subscribe({
    update: function (data) {
        synth.controls.offset = data.x;
        // synth.controls.amp = 1 - Math.pow(data.y, 2);
        synth.controls.trans = Math.pow(1.33 - data.y, 3);
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