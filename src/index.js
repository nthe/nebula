const Synth    = require('./synth/synth');
const KeyBoard = require('./keyboard/keyboard');
const Circle   = require('./circle/circle');
const Label    = require('./label/label');
const Scope    = require('./scope/scope');
const Slider   = require('./slider/slider');
const WaveForm = require('./waveform/waveform');
const XYPad    = require('./xypad/xypad');

module.exports = {
    Synth:          Synth,
    KeyBoard:       KeyBoard,
    GUI: {
        Circle:     Circle,
        Label:      Label,
        Scope:      Scope,
        Slider:     Slider,
        WaveForm:   WaveForm,
        XYPad:      XYPad
    }
};