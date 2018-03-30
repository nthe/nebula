const KeyBoardMock = require('../src/keyboard').KeyBoardMock;
const expect = require('chai').expect;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const log = console.log;

describe("KeyBoard", () => {

    // mock browser
    const window = new JSDOM(
        `<html lang="en"><head></head><body></body></html>`
    ).window;

    // pass mocked window object for registration / export
    KeyBoardMock(window);

    // create test instance
    const keyboard = window.KeyBoard();

    function Client() {
        this.data = null;
        this.update = function (data) {
            this.data = data;
        }
    }

    const client = new Client();
    keyboard.subscribe(client);

    const keyDownEvent = key => new window.KeyboardEvent('keydown', { view: window, key: key });
    const keyUpEvent = key => new window.KeyboardEvent('keyup', { view: window, key: key });

    describe("# notes", () => {

        beforeEach(() => {
            keyboard.heldKeys = {};
            keyboard.activeVoices = 0;
            keyboard.holdMode = false;
            keyboard.octave = 2;
            keyboard.velocity = 80;
        });


        it("should listen to key events", () => {
            const key = 'a';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(keyboard.heldKeys).to.have.nested.property(key);
        });

        it("should return emit object (note, voice, freq, state)", () => {
            const key = 'a';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(client.data).to.have.nested.property('note');
            expect(client.data).to.have.nested.property('voice');
            expect(client.data).to.have.nested.property('freq');
            expect(client.data).to.have.nested.property('state');
        });

        it("should assign unique voice to each held note", () => {
            const key_a = 'a';
            const kd_a = keyDownEvent(key_a);
            window.dispatchEvent(kd_a);
            expect(keyboard.heldKeys[key_a]).to.be.equal(0);

            const key_s = 's';
            const kd_s = keyDownEvent(key_s);
            window.dispatchEvent(kd_s);
            expect(keyboard.heldKeys[key_s]).to.be.equal(1);

            const key_d = 'd';
            const kd_d = keyDownEvent(key_d);
            window.dispatchEvent(kd_d);
            expect(keyboard.heldKeys[key_d]).to.be.equal(2);

            const key_f = 'f';
            const kd_f = keyDownEvent(key_f);
            window.dispatchEvent(kd_f);
            expect(keyboard.heldKeys[key_f]).to.be.equal(3);
        });

        it("should not react to specific keys", () => {
            const keys = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p'];
            for(let key of keys) {
                window.dispatchEvent(keyDownEvent(key));
                expect(keyboard.heldKeys).to.have.nested.property(key);
            }
        });

        it("should not react to other keys", () => {
            const keys = ['q', '1', 'r', 'm', 'ENTER', ' '];
            for(let key of keys) {
                window.dispatchEvent(keyDownEvent(key));
                expect(keyboard.heldKeys).to.not.have.nested.property(key);
            }
        });

        it("should emit note-on", () => {
            const kd1 = keyDownEvent('a');
            window.dispatchEvent(kd1);
            expect(client.data).to.have.nested.property('state');
            expect(client.data.state).to.be.equal('on');
        });

        it("should not emit note-off when in hold mode", () => {
            const kd1 = keyDownEvent('a');
            const ku1 = keyUpEvent('a');
            keyboard.holdMode = true;
            window.dispatchEvent(kd1);
            window.dispatchEvent(ku1);
            expect(client.data).to.have.nested.property('state');
            expect(client.data.state).to.be.equal('on');
        });

        it("should emit note-off when not in hold mode", () => {
            const kd1 = keyDownEvent('a');
            const ku1 = keyUpEvent('a');
            keyboard.holdMode = false;
            window.dispatchEvent(kd1);
            window.dispatchEvent(ku1);
            expect(client.data).to.have.nested.property('state');
            expect(client.data.state).to.be.equal('off');
        });


    });

    describe("# commands", () => {

        beforeEach(() => {
            keyboard.heldKeys = {};
            keyboard.activeVoices = 0;
            keyboard.holdMode = false;
            keyboard.octave = 2;
            keyboard.velocity = 80;
        });

        it("should return emit object (command, state)", () => {
            const key = 'b';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(client.data).to.have.nested.property('command');
            expect(client.data).to.have.nested.property('state');
        });

        it("should react to octave-up command (x)", () => {
            const key = 'x';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(keyboard.octave).to.equal(3);
        });

        it("should react to octave-down command (z)", () => {
            const key = 'z';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(keyboard.octave).to.equal(1);
        });

        it("should contrain lower range of octaves to -8)", () => {
            const key = 'z';
            const kd = keyDownEvent(key);
            keyboard.octave = -8;
            window.dispatchEvent(kd);
            expect(keyboard.octave).to.equal(-8);
        });

        it("should contrain upper range of octaves to 8", () => {
            const key = 'x';
            const kd = keyDownEvent(key);
            keyboard.octave = 8;
            window.dispatchEvent(kd);
            expect(keyboard.octave).to.equal(8);
        });

        it("should react to velocity-up command (v)", () => {
            const key = 'v';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(keyboard.velocity).to.equal(85);
        });

        it("should react to velocity-down command (c)", () => {
            const key = 'c';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(keyboard.velocity).to.equal(75);
        });

        it("should contrain lower range of velocity to 0", () => {
            const key = 'c';
            const kd = keyDownEvent(key);
            keyboard.velocity = 0
            window.dispatchEvent(kd);
            expect(keyboard.velocity).to.equal(0);
        });

        it("should contrain upper range of velocity to 127", () => {
            const key = 'v';
            const kd = keyDownEvent(key);
            keyboard.velocity = 127
            window.dispatchEvent(kd);
            expect(keyboard.velocity).to.equal(127);
        });

        it("should react to hold-mode command (b)", () => {
            const key = 'b';
            const kd = keyDownEvent(key);
            window.dispatchEvent(kd);
            expect(keyboard.holdMode).to.be.true;
        });

    });

    describe("# other", () => {
        
        it("should be subscribable", () => {
            keyboard.subscribe(client);
            keyboard.subscribe(client);
        });

        it("should be unsubscribable", () => {
            keyboard.unsubscribe(client);
            keyboard.unsubscribe(client);
        });
    });

});