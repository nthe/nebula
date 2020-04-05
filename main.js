const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

app.on('ready', function () {
    const win = new BrowserWindow({
        width: 780,
        height: 640,
        radii: [4, 4, 4, 4],
        frame: false,
        fullscreen: false,
        transparent: true,
        fullscreenable: false,
        titleBarStyle: 'hidden',
        resizable: false,
    })
    win.setMenu(null)
    win.loadURL(
        url.format({
            pathname: path.join(__dirname, 'public', 'index.html'),
            protocol: 'file:',
            slashes: true,
        })
    )
})

app.allowRendererProcessReuse = true
