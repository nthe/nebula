window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext

// create common context
const context = new AudioContext()

// get references
const pads = document.querySelector('#panel')
const envelopes = document.querySelector('.amp-envelope')
const filter = document.querySelector('.filter-controls')
const convolver = document.querySelector('.convolver')
const master = document.querySelector('.master')
const samples_list = document.querySelector('.samples-list')
const ir_samples_list = document.querySelector('.ir-samples-list')
const system_bar = document.querySelector('.system-bar')

// pre-populate samples
for (let sample of [
    'chair-1',
    'chair-2',
    'chair-3',
    'doors-1',
    'glasses-1',
    'gun-reload',
    'metal-can-1',
    'metallic-1',
    'foley',
]) {
    const li = document.createElement('li')
    li.innerHTML = sample
    samples_list.appendChild(li)
}

// attach listener to sample click
samples_list.addEventListener('click', event => {
    const sample = `audio/${event.target.innerHTML}.wav`
    for (let el of samples_list.children) {
        el.style.color = '#424242'
        el.style.backgroundColor = 'transparent'
    }
    event.target.style.backgroundColor = '#252525'
    event.target.style.color = '#aaa'
    wave.load(sample, function(buffer) {
        synth.buffer = buffer
    })
})

// pre-populate samples
for (let sample of [
    'brickworks',
    'car-park',
    'centre_stalls',
    'dome',
    'grange-centre',
    'koli-snow-site',
    'mh3-1',
    'mh3-2',
    'pommelte',
    'pozzella',
    'warehouse',
]) {
    const li = document.createElement('li')
    li.innerHTML = sample
    ir_samples_list.appendChild(li)
}

// attach listener to sample click
ir_samples_list.addEventListener('click', event => {
    const sample = `IRs/${event.target.innerHTML}.wav`
    for (let el of ir_samples_list.children) {
        el.style.color = '#424242'
        el.style.backgroundColor = 'transparent'
    }
    event.target.style.backgroundColor = '#252525'
    event.target.style.color = '#aaa'
    wave_IR.load(sample, function(buffer) {
        synth.convolver.buffer = buffer
    })
})

// create synth
const synth = ELM.Synth(context)

// create virtual keyboard
ELM.KeyBoard().subscribe(synth)

// create waveform window
const wave = ELM.GUI.WaveForm('elements-waveform-1', pads, synth)

// wave.subscribe({ update: console.log })
// console.log(wave)

const wave_IR = ELM.GUI.WaveForm('elements-waveform-2', pads)

/**
 *      [=== ENVELOPES ===]
 */

ELM.GUI.Circle('knob-grain-skew', filter)
    .configure({
        radius: 52,
        lineWidth: 4,
        sweepAngle: 180,
        value: 0.25,
        rangeColor: '#fff',
        backdropColor: '#424242',
        showHandle: false,
    })
    .subscribe({ update: data => (synth.controls.grainSkew = data) })

ELM.GUI.Circle('knob-grain-size', filter)
    .configure({
        radius: 120,
        lineWidth: 16,
        value: 0.5,
        rangeColor: '#fff',
        backdropColor: '#424242',
    })
    .subscribe({ update: data => (synth.controls.grainSize = data) })

/**
 *      [=== FILTER ===]
 */

ELM.GUI.Circle('knob-filter-q', filter)
    .configure({
        radius: 52,
        lineWidth: 4,
        value: 0.1,
        rangeColor: '#1f7',
        backdropColor: '#424242',
        showHandle: false,
    })
    .subscribe({ update: data => (synth.Q = data * 30) })

ELM.GUI.Circle('knob-filter-cutoff', filter)
    .configure({
        radius: 52,
        lineWidth: 6,
        value: 1,
        rangeColor: '#1f7',
        backdropColor: '#424242',
    })
    .subscribe({
        update: data => (synth.cutoff = Math.pow(data, 2) * 20000),
    })

const filterType = window.document.createElement('p')
let selectedFilterIndex = 0
filterType.onclick = () => {
    selectedFilterIndex = (selectedFilterIndex + 1) % synth.filterTypes.length
    synth.filterType = synth.filterTypes[selectedFilterIndex]
    filterType.innerHTML = synth.filterTypes[selectedFilterIndex]
}

filterType.classList.add('filterType')
filterType.innerHTML = 'lowpass'
filter.appendChild(filterType)

/**
 *      [=== CONVOLVER ===]
 */

ELM.GUI.Circle('knob-convolver-blend', convolver)
    .configure({
        radius: 52,
        lineWidth: 6,
        rangeColor: '#1cf',
        backdropColor: '#424242',
    })
    .subscribe({
        update: data =>
            synth.convolverGain.gain.setValueAtTime(data, context.currentTime),
    })

// ELM.GUI.Circle('knob-convolver-blend', convolver)
//     .configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

// ELM.GUI.Circle('knob-convolver-cutoff', convolver)
//     .configure({radius: 52, lineWidth: 4, rangeColor: '#1cf', backdropColor: '#424242', showHandle: false});

/**
 *      [=== CONVOLVER ===]
 */

ELM.GUI.Circle('knob-master-pan', master)
    .configure({
        radius: 52,
        value: 0.75,
        sweepAngle: 180,
        lineWidth: 4,
        rangeColor: '#f55',
        backdropColor: '#424242',
        showHandle: false,
    })
    .subscribe({ update: data => (synth.controls.pan = data) })

ELM.GUI.Circle('knob-master-amp', master)
    .configure({
        radius: 52,
        value: 0.95,
        lineWidth: 6,
        rangeColor: '#f55',
        backdropColor: '#424242',
    })
    .subscribe({ update: data => (synth.amp = data) })

ELM.GUI.XYPad('elements-xypad-3', pads)
    .configure({ width: 500, height: 250 })
    .subscribe({
        update: function(data) {
            synth.controls.offset = data.x
            // synth.controls.amp = 1 - Math.pow(data.y, 2);
            synth.controls.trans = Math.pow(1.33 - data.y, 4)
            wave.value = data.x
            wave.render()
        },
    })

const xypad2 = ELM.GUI.XYPad('elements-xypad-4', pads)
    .configure({ width: 500, height: 125 })
    .subscribe({
        update: function(data) {
            synth.controls.density = data.x * 100
            synth.controls.spread = 1 - data.y
        },
    })

xypad2.element.style.marginLeft = 8

const scope = ELM.GUI.Scope('elements-scope', pads)
scope
    .init(context)
    .connect(synth.master)
    .run()

wave.load('audio/gun-reload.wav', function(buffer) {
    synth.buffer = buffer
    samples_list.children[5].style.color = '#aaa'
    samples_list.children[5].style.backgroundColor = '#252525'
})

wave_IR.load('IRs/warehouse.wav', function(buffer) {
    synth.convolver.buffer = buffer
})

const record = document.querySelector('.record-button')
const close = document.querySelector('.close')
const minimize = document.querySelector('.minimize')

close.onclick = event => this.window.close()

const dest = context.createMediaStreamDestination()
const mediaRecorder = new MediaRecorder(dest.stream)
synth.master.connect(dest)
dest.connect(context.destination)

let recording = false
record.onclick = function() {
    if (!recording) {
        mediaRecorder.start()
        record.src = 'icons/media-stop.svg'
    } else {
        mediaRecorder.stop()
        record.src = 'icons/media-record.svg'
    }
    recording = !recording
}

const chunks = []

mediaRecorder.ondataavailable = e => {
    chunks.push(e.data)
}

mediaRecorder.onstop = function(e) {
    // let fileReader = new FileReader();
    // // fileReader.read
    // fileReader.onload = function() {

    //     var incomingData = new Uint8Array(this.result);
    //     var i, l = incomingData.length;
    //     var buffer = new Float32Array(incomingData.length);
    //     for (i = 0; i < l; i++) {
    //         buffer[i] = (incomingData[i] - 128) / 128.0;
    //     }

    //     const encoder = new WavAudioEncoder(22000, 1);
    //     var buffers = [];
    //     buffers.push(buffer);
    //     encoder.encode(buffers);
    //     const blob = encoder.finish();
    //     console.log(blob);
    //     encoder.cancel();
    //     // fileReader.readAsArrayBuffer(chunks[0]);
    // // var blob = new Blob(chunks, { 'type' : 'audio/wav; codecs=opus' });
    //     var audioURL = window.URL.createObjectURL(blob);
    //     var anchor = document.createElement('a');
    //     anchor.href = audioURL;
    //     anchor.download = `nubula-audio-recording.wav`;
    //     anchor.click();

    // };
    // fileReader.readAsArrayBuffer(chunks[0]);
    var blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' })
    var audioURL = window.URL.createObjectURL(blob)
    var anchor = document.createElement('a')
    anchor.href = audioURL
    anchor.download = `nubula-audio-recording.webm`
    anchor.click()
}
