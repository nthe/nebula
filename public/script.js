window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext

// create common context
const context = new AudioContext()

// get references
const pads = document.querySelector('#panel')
const consolePanel = document.querySelector('.console')
const samples_list = document.querySelector('.samples-list')
const ir_samples_list = document.querySelector('.ir-samples-list')
const system_bar = document.querySelector('.system-bar')

// -------------------------------------------------------------- ENGINE SETUP

const synth = ELM.Synth(context)

ELM.KeyBoard().subscribe(synth)

ELM.GUI.Scope('elements-scope', pads).init(context).connect(synth.master).run()

// -------------------------------------------------------------- RESOURCES

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
]) {
    const li = document.createElement('li')
    li.innerHTML = sample
    samples_list.appendChild(li)
}

// attach listener to sample click
samples_list.addEventListener('click', (event) => {
    const sample = `./assets/audio/samples/${event.target.innerHTML}.wav`
    for (let el of samples_list.children) {
        if (el.classList.contains('active')) {
            el.classList.toggle('active')
        }
    }
    event.target.classList.toggle('active')
    wave.load(sample, function (buffer) {
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
ir_samples_list.addEventListener('click', (event) => {
    const sample = `./assets/audio/impulses/${event.target.innerHTML}.wav`
    for (let el of ir_samples_list.children) {
        el.style.color = '#424242'
        el.style.backgroundColor = 'transparent'
    }
    event.target.style.backgroundColor = '#252525'
    event.target.style.color = '#aaa'
    wave_IR.load(sample, function (buffer) {
        synth.convolver.buffer = buffer
    })
})

// -------------------------------------------------------------- WAVEFORM SETUP

const wave = ELM.GUI.WaveForm('elements-waveform-1', pads, synth)

const wave_IR = ELM.GUI.WaveForm('elements-waveform-2', pads)

wave.load('./assets/audio/samples/gun-reload.wav', function (buffer) {
    synth.buffer = buffer
    // samples_list.children[5].style.color = '#aaa'
    // samples_list.children[5].style.backgroundColor = '#252525'
})

wave_IR.load('./assets/audio/impulses/warehouse.wav', function (buffer) {
    synth.convolver.buffer = buffer
})

// -------------------------------------------------------------- GRAIN CONTROL PANEL

ELM.GUI.Circle('knob-grain-skew', consolePanel)
    .configure({
        rangeColor: '#fff',
        value: 0.25,
    })
    .subscribe({ update: (data) => (synth.controls.grainSkew = data) })

ELM.GUI.Circle('knob-grain-size', consolePanel)
    .configure({
        rangeColor: '#fff',
        value: 0.5,
    })
    .subscribe({ update: (data) => (synth.controls.grainSize = data) })

ELM.GUI.Circle('knob-grain-density', consolePanel)
    .configure({
        rangeColor: '#fff',
        sweepAngle: 180,
        value: 0.8,
    })
    .subscribe({ update: (data) => (synth.controls.density = data * 100) })

ELM.GUI.Circle('knob-grain-spread', consolePanel)
    .configure({
        rangeColor: '#fff',
        sweepAngle: 180,
        startAngle: 0,
        value: 0.8,
    })
    .subscribe({ update: (data) => (synth.controls.spread = 1 - data) })

// -------------------------------------------------------------- CONSOLE PANEL

ELM.GUI.Circle('knob-master-amp', consolePanel)
    .configure({
        value: 0.8,
        rangeColor: '#f55',
    })
    .subscribe({ update: (data) => (synth.amp = data) })

ELM.GUI.Circle('knob-convolver-blend', consolePanel)
    .configure({
        rangeColor: '#1cf',
        value: 0.75,
    })
    .subscribe({
        update: (data) =>
            synth.convolverGain.gain.setValueAtTime(data, context.currentTime),
    })

ELM.GUI.Circle('knob-filter-cutoff', consolePanel)
    .configure({
        rangeColor: '#1f7',
        value: 1,
    })
    .subscribe({
        update: (data) => (synth.cutoff = Math.pow(data, 2) * 20000),
    })

ELM.GUI.Circle('knob-filter-q', consolePanel)
    .configure({
        rangeColor: '#1f7',
        value: 0.1,
    })
    .subscribe({ update: (data) => (synth.Q = data * 30) })

consolePanel.appendChild(attachFilterTypeSwitch(synth))

// -------------------------------------------------------------- XY-PAD PANEL

ELM.GUI.XYPad('elements-xypad-3', pads)
    .configure({ width: 500, height: 250 })
    .subscribe({
        update: function (data) {
            synth.controls.offset = data.x
            synth.controls.trans = Math.pow(1.33 - data.y, 4)
            wave.value = data.x
            wave.render()
        },
    })

// -------------------------------------------------------------- RECORDING SETUP

document.querySelector('.close').onclick = () => this.window.close()

const dest = context.createMediaStreamDestination()
const mediaRecorder = new MediaRecorder(dest.strea)
synth.master.connect(dest)
dest.connect(context.destination)

const record = document.querySelector('.record-button')
let recording = false
record.onclick = function () {
    if (!recording) {
        mediaRecorder.start()
        record.src = './assets/icons/media-stop.svg'
    } else {
        mediaRecorder.stop()
        record.src = './assets/icons/media-record.svg'
    }
    recording = !recording
}

const chunks = []

mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data)
}

mediaRecorder.onstop = function (e) {
    var blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' })
    var audioURL = window.URL.createObjectURL(blob)
    var anchor = document.createElement('a')
    anchor.href = audioURL
    anchor.download = `nubula-audio-recording.webm`
    anchor.click()
}
