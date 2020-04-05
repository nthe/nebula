const Synth = require('./synth/synth')
const KeyBoard = require('./keyboard/keyboard')
const Circle = require('./circle/circle')
const Scope = require('./scope/scope')
const WaveForm = require('./waveform/waveform')
const XYPad = require('./xypad/xypad')

module.exports = {
    Synth: Synth,
    KeyBoard: KeyBoard,
    GUI: {
        Circle: Circle,
        Scope: Scope,
        WaveForm: WaveForm,
        XYPad: XYPad,
    },
}
