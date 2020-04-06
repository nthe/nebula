window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext

// create common context
const context = new AudioContext()

// get references
const controlPanel = document.querySelector('#panel')
const consolePanel = document.querySelector('.console')
const grainPanel = document.querySelector('.console2')
const samples = document.querySelector('.samples-list')
const impulses = document.querySelector('.ir-samples-list')

// -------------------------------------------------------------- ENGINE SETUP

const synth = ELM.Synth(context)

ELM.KeyBoard().subscribe(synth)

ELM.GUI.Scope('elements-scope', controlPanel)
    .init(context)
    .connect(synth.master)
    .run()

// -------------------------------------------------------------- RESOURCES

loadAudioSamples(samples, (sample) => {
    waveSample.load(sample, function (buffer) {
        synth.buffer = buffer
    })
})

loadImpulseResponses(impulses, (sample) => {
    waveImpulse.load(sample, function (buffer) {
        synth.convolver.buffer = buffer
    })
})

// -------------------------------------------------------------- WAVEFORM SETUP

const waveSample = ELM.GUI.WaveForm('elements-waveform-1', controlPanel, synth)

const waveImpulse = ELM.GUI.WaveForm('elements-waveform-2', controlPanel)

waveSample.load('./assets/audio/samples/Chair.wav', function (buffer) {
    synth.buffer = buffer
    samples.children[0].classList.toggle('active')
})

waveImpulse.load('./assets/audio/impulses/MicroVerb.wav', function (buffer) {
    synth.convolver.buffer = buffer
    impulses.children[2].classList.toggle('active')
})

// -------------------------------------------------------------- GRAIN CONTROL PANEL

ELM.GUI.Circle('knob-grain-skew', grainPanel)
    .addLabel('SKEW')
    .configure({
        rangeColor: '#fff',
        value: 0.25,
    })
    .subscribe({ update: (data) => (synth.controls.grainSkew = data) })

ELM.GUI.Circle('knob-grain-size', grainPanel)
    .addLabel('SIZE')
    .configure({
        rangeColor: '#fff',
        value: 0.5,
    })
    .subscribe({ update: (data) => (synth.controls.grainSize = data) })

ELM.GUI.Circle('knob-grain-density', grainPanel)
    .addLabel('DENS')
    .configure({
        rangeColor: '#fff',
        value: 0.8,
    })
    .subscribe({ update: (data) => (synth.controls.density = data * 100) })

ELM.GUI.Circle('knob-grain-spread', grainPanel)
    .addLabel('SPRD')
    .configure({
        rangeColor: '#fff',
        value: 0.8,
    })
    .subscribe({ update: (data) => (synth.controls.spread = 1 - data) })

// -------------------------------------------------------------- CONSOLE PANEL

ELM.GUI.Circle('knob-master-amp', consolePanel)
    .addLabel('GAIN')
    .configure({
        value: 0.8,
        rangeColor: '#f55',
    })
    .subscribe({ update: (data) => (synth.amp = data) })

ELM.GUI.Circle('knob-convolver-blend', consolePanel)
    .addLabel('ECHO')
    .configure({
        rangeColor: '#1cf',
        value: 0.75,
    })
    .subscribe({
        update: (data) =>
            synth.convolverGain.gain.setValueAtTime(data, context.currentTime),
    })

ELM.GUI.Circle('knob-filter-cutoff', consolePanel)
    .addLabel('FREQ')
    .configure({
        rangeColor: '#1f7',
        value: 1,
    })
    .subscribe({
        update: (data) => (synth.cutoff = Math.pow(data, 2) * 20000),
    })

ELM.GUI.Circle('knob-filter-q', consolePanel)
    .addLabel('Q')
    .configure({
        rangeColor: '#1f7',
        value: 0.1,
    })
    .subscribe({ update: (data) => (synth.Q = data * 30) })

consolePanel.appendChild(attachFilterTypeSwitch(synth))

// -------------------------------------------------------------- XY-PAD PANEL

ELM.GUI.XYPad('elements-xypad-3', controlPanel)
    .configure({ width: 500, height: 250 })
    .subscribe({
        update: function (data) {
            synth.controls.offset = data.x
            synth.controls.trans = Math.pow(1.33 - data.y, 4)
            waveSample.value = data.x
            waveSample.render()
        },
    })

// -------------------------------------------------------------- RECORDING SETUP

document.querySelector('.close').onclick = () => this.window.close()

attachRecordingService(context, synth)
