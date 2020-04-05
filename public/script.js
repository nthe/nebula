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
const consolePanel2 = document.querySelector('.console2')
const samples_list = document.querySelector('.samples-list')
const ir_samples_list = document.querySelector('.ir-samples-list')

// -------------------------------------------------------------- ENGINE SETUP

const synth = ELM.Synth(context)

ELM.KeyBoard().subscribe(synth)

ELM.GUI.Scope('elements-scope', pads).init(context).connect(synth.master).run()

// -------------------------------------------------------------- RESOURCES

loadAudioSamples(samples_list, (sample) => {
    wave.load(sample, function (buffer) {
        synth.buffer = buffer
    })
})

loadImpulseResponses(ir_samples_list, (sample) => {
    wave_IR.load(sample, function (buffer) {
        synth.convolver.buffer = buffer
    })
})

// -------------------------------------------------------------- WAVEFORM SETUP

const wave = ELM.GUI.WaveForm('elements-waveform-1', pads, synth)

const wave_IR = ELM.GUI.WaveForm('elements-waveform-2', pads)

wave.load('./assets/audio/samples/Chair.wav', function (buffer) {
    synth.buffer = buffer
    samples_list.children[0].classList.toggle('active')
})

wave_IR.load('./assets/audio/impulses/RE301.wav', function (buffer) {
    synth.convolver.buffer = buffer
    ir_samples_list.children[3].classList.toggle('active')
})

// -------------------------------------------------------------- GRAIN CONTROL PANEL

ELM.GUI.Circle('knob-grain-skew', consolePanel2)
    .configure({
        rangeColor: '#fff',
        value: 0.25,
    })
    .subscribe({ update: (data) => (synth.controls.grainSkew = data) })

ELM.GUI.Circle('knob-grain-size', consolePanel2)
    .configure({
        rangeColor: '#fff',
        value: 0.5,
    })
    .subscribe({ update: (data) => (synth.controls.grainSize = data) })

ELM.GUI.Circle('knob-grain-density', consolePanel2)
    .configure({
        rangeColor: '#fff',
        value: 0.8,
    })
    .subscribe({ update: (data) => (synth.controls.density = data * 100) })

ELM.GUI.Circle('knob-grain-spread', consolePanel2)
    .configure({
        rangeColor: '#fff',
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

attachRecordingService(context, synth)
