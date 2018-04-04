const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

app.on('ready', function () {
    const win = new BrowserWindow({ 
        width: 1500,
        height: 700,
        frame: false,
        transparent: false
    });
    win.setMenu(null);
    win.setResizable(false);
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
});