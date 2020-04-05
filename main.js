const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

app.on('ready', function () {
    const win = new BrowserWindow({
        width: 760,
        height: 600,
        radii: [4, 4, 4, 4],
        frame: false,
        fullscreen: false,
        transparent: true,
        fullscreenable: false,
        titleBarStyle: 'hidden',
    })
    win.setMenu(null)
    win.setResizable(false)
    win.loadURL(
        url.format({
            pathname: path.join(__dirname, 'public', 'index.html'),
            protocol: 'file:',
            slashes: true,
        })
    )
})
