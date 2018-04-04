window.AudioContext = (
    window.AudioContext
    || window.webkitAudioContext
    || window.mozAudioContext
    || window.oAudioContext
);

// create common context
const context = new AudioContext();

// get references
const pads = document.querySelector('#panel');
const envelopes = document.querySelector('.amp-envelope');
const filter = document.querySelector('.filter-controls');
const convolver = document.querySelector('.convolver');
const samples_list = document.querySelector('.samples-list');

// pre-populate samples
for (let sample of ['chair-1', 'chair-2', 'chair-3', 'doors-1', 'glasses-1', 'gun-reload', 'metal-can-1', 'metallic-1']) {
    const li = document.createElement('li');
    li.innerHTML = sample;
    samples_list.appendChild(li);
}

// attach listener to sample click
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


// create synth
const synth = ELM.Synth(context);

// create virtual keyboard
ELM.KeyBoard().subscribe(synth);

// create waveform window
const wave = ELM.GUI.WaveForm('elements-waveform-1', pads);

/**
 *      [=== ENVELOPES ===]
 */

ELM.GUI.Circle('knob-grain-size', envelopes)
    .configure({radius: 120, lineWidth: 16, rangeColor: '#1cf', backdropColor: '#424242'})
    .subscribe({ update: (data) => synth.controls.grainSize = data });

ELM.GUI.Circle('knob-grain-skew', envelopes)
    .configure({radius: 52, lineWidth: 4, value: 0.25, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false})
    .subscribe({ update: (data) => synth.controls.grainSkew = data });

ELM.GUI.Circle('knob-voice-attack', envelopes)
    .configure({radius: 72, lineWidth: 8, value: 0.15, rangeColor: '#1cf', backdropColor: '#424242'})
    .subscribe({ update: (data) => synth.controls.attack = data });

ELM.GUI.Circle('knob-voice-release', envelopes)
    .configure({radius: 72, lineWidth: 8, value: 0.33, rangeColor: '#1cf', backdropColor: '#424242'})
    .subscribe({ update: (data) => synth.controls.release = data });

/**
 *      [=== FILTER ===]
 */
    
ELM.GUI.Circle('knob-filter-q', filter)
    .configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

ELM.GUI.Circle('knob-filter-cutoff', filter)
    .configure({radius: 92, lineWidth: 14, rangeColor: '#1cf', backdropColor: '#424242'});

ELM.GUI.Circle('knob-filter-gain', filter)
    .configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

/**
 *      [=== CONVOLVER ===]
 */

ELM.GUI.Circle('knob-noise-blend', convolver)
    .configure({radius: 92, lineWidth: 14, rangeColor: '#1cf', backdropColor: '#424242'});

ELM.GUI.Circle('knob-convolver-blend', convolver)
    .configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

ELM.GUI.Circle('knob-convolver-cutoff', convolver)
    .configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});



ELM.GUI.XYPad('elements-xypad-3', pads)
    .configure({ width: 500, height: 125 })
    .subscribe({
        update: function (data) {
            synth.controls.offset = data.x;
            // synth.controls.amp = 1 - Math.pow(data.y, 2);
            synth.controls.trans = Math.pow(1.33 - data.y, 3);
            wave.value = data.x;
            wave.render();
        }
    });

const xypad2 = ELM.GUI.XYPad('elements-xypad-4', pads)
    .configure({ width: 500, height: 125 })
    .subscribe({
        update: function (data) {
            synth.controls.density = data.x * 100;
            synth.controls.spread = 1 - data.y;
        }
    });

xypad2.element.style.marginLeft = 8;

// const scope = Scope('elements-scope', pads);

// scope.init(context).connect(synth.master);

wave.load('audio/gun-reload.wav', function (buffer) {
    synth.buffer = buffer;
    samples_list.children[5].style.color = "#fc1";
});
