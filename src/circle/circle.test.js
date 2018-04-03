const expect = require('chai').expect;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const log = console.log;


describe("Circle", () => {

    // mock browser
    const window = new JSDOM(
        `<html lang="en"><head></head><body></body></html>`
    ).window;

    // assign mocked window object
    global.window = window;
    // pass mocked window object for registration / export
    const Circle = require('./circle');
    
    const document = window.document;
    const body = document.body;
    const $one = (el) => document.querySelector(el);
    const $all = (el) => document.querySelectorAll(el);

    // prepare reference
    let knob = null;

    // prepare event
    const mouseUpEvent = new window.MouseEvent('mouseup', { 
        view: window
    });
    const mouseDownEvent = new window.MouseEvent('mousedown', { 
        view: window,
        clientY: 100
    });
    const mouseMoveEvent = new window.MouseEvent('mousemove', { 
        view: window
    });

    before('creating knob', () => {
        knob = Circle('knob-1', body);
        knob.configure({
            value: 0.25
        });
    });

    it('should be rendered in DOM', () => { 
        expect(body.children.length).to.equal(1);
    });

    it('should render canvas element', () => {
        expect(body.children[0]).to.be.instanceOf(window.HTMLCanvasElement);
    });

    it('should have reference to html element', () => {
        expect(knob.element).to.be.instanceOf(window.HTMLCanvasElement);
        expect(knob.element).to.equal(body.children[0]);
    });

    it('should be update-able manually', () => {
        expect(knob.value).to.equal(0.25);
        knob.setValue(1);
        expect(knob.value).to.equal(1);
    });

    it('should react to mousedown event', () => {
        knob.element.dispatchEvent(mouseDownEvent);
    });

    it('should not react to mouseup event on its own', () => {
        knob.element.dispatchEvent(mouseUpEvent);
    });
    
    it('should react to mouseup event after mousedown event', () => {
        knob.element.dispatchEvent(mouseDownEvent);
        document.dispatchEvent(mouseUpEvent);
    });
    
    it('should not react to mousemove event on its own', () => {
        document.dispatchEvent(mouseMoveEvent);
    });

    it('should react to mousemove event', () => {
        knob.element.dispatchEvent(mouseDownEvent);
        document.dispatchEvent(mouseMoveEvent);
        document.dispatchEvent(mouseUpEvent);
    });

    it('should increase value when mouse moved up', () => {
        let initValue = 0.5;
        knob.value = initValue;
        let mouseMoveEvent = new window.MouseEvent('mousemove', { 
            view: window,
            clientY: 50
        });
        knob.element.dispatchEvent(mouseDownEvent);
        global.window.dispatchEvent(mouseMoveEvent);
        global.window.dispatchEvent(mouseUpEvent);
        expect(knob.value).to.be.above(initValue);
    });

    it('should decrease value when mouse moved down', () => {
        let initValue = 0.025;
        knob.value = initValue;
        let mouseMoveEvent = new window.MouseEvent('mousemove', { 
            view: window,
            clientY: 110
        });
        knob.element.dispatchEvent(mouseDownEvent);
        global.window.dispatchEvent(mouseMoveEvent);
        global.window.dispatchEvent(mouseUpEvent);
        expect(knob.value).to.be.below(initValue);
    });

    it('should not react to event when deactivated', () => {
        knob.deactivate();
        let initValue = 0.5;
        knob.setValue(initValue);
        let mouseMoveEvent = new window.MouseEvent('mousemove', { 
            view: window,
            clientY: 90
        });
        knob.element.dispatchEvent(mouseDownEvent);
        document.dispatchEvent(mouseMoveEvent);
        document.dispatchEvent(mouseUpEvent);
        expect(knob.value).to.be.equal(initValue);
        knob.activate();
    });
});
