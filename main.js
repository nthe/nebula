const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

app.on('ready', function () {
    const win = new BrowserWindow({ 
        width: 1325,
        height: 710,
        frame: false,
        fullscreen: false,
        transparent: false,
        fullscreenable: false,
        titleBarStyle: 'hidden'
    });
    win.setMenu(null);
    win.setResizable(false);
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
});