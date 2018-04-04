/**
 * Grranular synthesizer. 
 * 
 * @description Granular synthesizer.
 * @author Juraj Onuska
 * @e-mail: jurajonuska@gmail.com
 */

const Synth    = require('./synth/synth');
const KeyBoard = require('./keyboard/keyboard');
const Circle   = require('./circle/circle');
const Label    = require('./label/label');
const Scope    = require('./scope/scope');
const Slider   = require('./slider/slider');
const WaveForm = require('./waveform/waveform');
const XYPad    = require('./xypad/xypad');
// const Utils    = require('./utils/utils');

const lib = {
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

// console.log(lib);
// window.ELM = lib;
module.exports = lib;
// export default lib;