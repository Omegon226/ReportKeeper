const fs = require('fs');
const Excel = require('exceljs');

const electron = require('electron');
const url = require('url');
const path = require('path');
var $ = require('jquery');
const settings = require("./settings.js");
const nn = require("./neturalNetwork.js");

const os = require('os');
const storage = require('electron-json-storage');

storage.setDataPath(os.tmpdir());

const { app, BrowserWindow, ipcMain, Tray, Menu } = electron;

let mainWindow;

function createStatisticsWindow() {
    settings.loadSettings().then(() => {
        statisticsWindow = new BrowserWindow({
            width: 650,
            height: 300,
            title: 'Statistics',
            parent: mainWindow,
            modal: true,
            skipTaskbar: true,
            backgroundColor: '#333',
        });

     //   statisticsWindow.webContents.openDevTools();

        // Load HTML into the window.
        statisticsWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'statisticsWindow.html'),
            protocol: 'file',
            slashes: true
        }));
    });
}

function createWindow() {
    settings.loadSettings().then(() => {
        tray = new Tray(__dirname + '/icon.png');
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 650,
            height: 140,
            frame: false,
            resizable: false,
            skipTaskbar: true,
            show: true,
            alwaysOnTop: settings.getSettings().topMost,
            backgroundColor: '#333',
        });
        mainWindow.setVisibleOnAllWorkspaces(true);

        mainWindow.webContents.openDevTools();

        tray.setToolTip('Report Keeper')
        const trayContextMenu = createContextMenu(mainWindow)
        tray.setContextMenu(trayContextMenu)

        tray.on('click', () => {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        })

        // and load the index.html of the app.
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'mainWindow.html'),
            protocol: 'file',
            slashes: true
        }));
    });
    // nn.createNN();
    // nn.openNN();
    //nn.createLSTN();
}

function createContextMenu(appWindow) {
    return (
        Menu.buildFromTemplate([
            {
                label: 'Show/Hide', click: function () {
                    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
                }
            },
            {
                label: 'Settings', click: function () {
                    settings.createSettingsWindow(mainWindow);
                }
            },
            {
                label: 'Quit', click: function () {
                    app.isQuiting = true;
                    app.quit();
                }
            }
        ])
    );
}

function hideMainWindow() {
    mainWindow.hide();
}

function showMainWindow() {
    mainWindow.show();
}

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});  //закрытие окна и сворачивание в док если это OS X

ipcMain.on('statistics:open', (e, args) => {
    createStatisticsWindow(mainWindow);
});

ipcMain.on('settings:opened', (e, args) => {
    settings.openSettings();
});

ipcMain.on('settings:uploadProjects', (e, args) => {
    settings.uploadProjects();
});

ipcMain.on('settings:cancel', (e, args) => {
    settings.cancelSettings();
});

ipcMain.on('settings:save', (e, args) => {
    settings.saveSettings(args, app);
});

ipcMain.on('mainWindow:hide', (e, args) => {
    hideMainWindow();
});

ipcMain.on('mainWindow:show', (e, args) => {
    showMainWindow();
});

ipcMain.on('main:opened', (e, args) => {
    const settingsToSend = settings.getSettings();
    mainWindow.webContents.send('settings:sent', settingsToSend);
});

ipcMain.on('settings:selectPath', (e, args) => {
    settings.selectPath();
});

ipcMain.on('statistics:opened', (e, args) => {
    const settingsToSend = settings.getSettings();
    statisticsWindow.webContents.send('settings:sent', settingsToSend);
});
