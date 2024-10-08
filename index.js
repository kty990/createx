const { app, BrowserWindow, Menu, dialog, ipcMain, autoUpdater, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util');
const { build, ActionEvent } = require("./build");
const groups = require('./dist/groups.json');
const settings = require('./settings.json');
const { debug } = require('console');

var licenseData;
var currentFile;
var settingsWindow = null;
var themesWindow = null;
var debugWindow = null;

fs.readFile("./license.md", (err, data) => {
    licenseData = data; 0
})

let devToolsOpened = false;

class GraphicsWindow {
    constructor(html, width = 800, height = 600, forceMax = false) {
        try {
            this.window = null;
            this.current_z_index = 0;
            this.layers = []; // List to store layers
            this.active_layer = null; // Currently active layer

            this.currentProject = null;

            app.on('ready', async () => {
                await this.createWindow(html, width, height, forceMax);
                this.window.once('closed', () => {
                    if (settingsWindow) {
                        settingsWindow.window.close();
                    }
                    if (themesWindow) {
                        themesWindow.window.close();
                    }
                    if (debugWindow) {
                        debugWindow.window.close();
                    }
                })
            });
        } catch (e) {
            const { Notification } = require('electron')

            const NOTIFICATION_TITLE = 'Error'
            const NOTIFICATION_BODY = `${e} `

            new Notification({
                title: NOTIFICATION_TITLE,
                body: NOTIFICATION_BODY
            }).show()
        }
    }

    async createWindow(html, w, h, forceMax = false) {
        let options = {
            width: w,
            height: h,
            minWidth: w,   // Set the minimum width
            minHeight: h,  // Set the minimum height
            frame: false, // Remove the default window frame (including the title bar)
            webPreferences: {
                nodeIntegration: true,
                spellcheck: false,
                preload: path.join(__dirname, './dist/js/preload.js')
            },
        }
        if (forceMax) {
            options.maxHeight = h;
            options.maxWidth = w;
        }
        this.window = new BrowserWindow(options);

        // Set the window icon
        const iconPath = path.join(__dirname, './dist/images/icon.png');
        this.window.setIcon(iconPath);

        const menu = Menu.buildFromTemplate([]);
        Menu.setApplicationMenu(menu);

        this.window.setMenu(menu);

        this.window.loadFile(html);

        this.window.on('closed', () => {
            this.window = null;
        });
    }
}

const graphicsWindow = new GraphicsWindow('./dist/html/index.html');

const components = []
const files = [];

class File {
    code = "";
    constructor(name = null) {
        if (name == null) {
            this.name = `File ${files.length + 1}`;
        } else {
            this.name = name;
        }
    }

    setCode(code) {
        this.code = code;
    }
}

ActionEvent.receive('get_js_files', () => {
    ActionEvent.fire('get_js_files', files);
})

ActionEvent.receive('get_components', () => {
    ActionEvent.fire('get_components', components);
})

ActionEvent.receive('get_icon', () => {
    ActionEvent.fire('get_icon', settings.icon);
})

ActionEvent.receive('getversion', () => {
    ActionEvent.fire('getversion', settings.version);
})

ActionEvent.receive('getdescription', () => {
    ActionEvent.fire('getdescription', settings.description);
})

ActionEvent.receive('getauthor', () => {
    ActionEvent.fire('getauthor', settings.author);
})

async function exportProject() {
    // Get export destination
    const now = new Date();

    const year = now.getFullYear();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2,
        '0');

    const formattedDate
        = `${year}_${day}_${month} -${hour}_${minute}_${second} `;

    let { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: `${year}_${month}_${day} -${hour}_${minute}_${second}.amk`,
        filters: [
            { name: 'CreatEx Files', extensions: ['amk'] }
        ]
    });
    if (canceled) return;

    const isDoubleTagged = (type) => {
        const singleTagged = [
            'input',
            'img',
            'br',
            'hr',
            'meta',
            'link',
            'source',
            'track',
            'embed',
            'area',
            'base',
            'col',
            'command',
            'keygen',
            'param',
            'option'
        ];
        return !(singleTagged.includes(type.toLowerCase().trim()));
    }

    const make = (comp) => {
        let stylized = "";
        let text = "";
        for (const [key, value] of Object.entries(comp)) {
            if (!['name', 'type'].includes(key) && key.toLowerCase() != "text_content") {
                stylized += `${key}:${value};`
            } else if (key.toLowerCase() == "text_content") {
                text = value;
            }
        }
        stylized += `left:${comp.left};`;
        stylized += `top:${comp.top};`;
        stylized += `width:${comp.width};`;
        stylized += `height:${comp.height};`;
        let e = `<${comp.type} style="${stylized}">${text}</${comp.type}>`;
        if (!isDoubleTagged(comp.type)) {
            e = e.replace(`</${comp.type}>`, "");
        }
        return e;
    }

    let allComps = [];
    for (const comp of components) {
        // console.log("comp")
        // console.log(comp);
        let strComp = make(comp);
        allComps.push(strComp);
    }

    let result = allComps.join("\n");

    result += `\n(LICENSE): ${licenseData}\n(ICON): ${icon}`;

    let path = filePath;
    if (!path.endsWith(".amk")) {
        path += '.amk';
    }

    function stringToBinary(str) {
        let binaryString = "";

        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            let binaryChar = charCode.toString(2).padStart(8, "0");
            binaryString += binaryChar + " ";
        }

        return binaryString;
    }
    fs.writeFile(path, stringToBinary(result), (err) => {
    })
}

/**
 * @returns {Promise<{result: Boolean, value: String, license: String}>}
 */
async function openProject() {
    function binaryToString(binaryString) {
        let binaryChunks = binaryString.split(" ")
        let asciiChars = binaryChunks.map(chunk => String.fromCharCode(parseInt(chunk, 2)));

        // Join characters into a string
        return asciiChars.join('');
    }
    return new Promise(async (resolve) => {
        let { filePaths, canceled } = await dialog.showOpenDialog({
            defaultPath: ``,
            filters: [
                { name: 'CreatEx Files', extensions: ['amk'] }
            ],
            buttonLabel: "Open Project"
        });
        if (canceled) {
            resolve({ result: false, value: 'Cancelled', license: licenseData });
            return;
        };
        const data = await util.promisify(fs.readFile)(filePaths[0]);
        let tmp_v = binaryToString(data.toString());
        let v = tmp_v.split("(LICENSE): ")[0];
        let license = tmp_v.split("(LICENSE): ")[1];
        console.log('v', v);
        console.log('license', license);
        resolve({ result: data instanceof Buffer, value: v, license })
    })
}



// Hooks
ipcMain.on("deleteComponent", (event, name) => {
    for (let i = 0; i < components.length; i++) {
        if (components[i].name == name) {
            components.splice(i, 1);
            break;
        }
    }
})
ipcMain.on("editComponent", (_, name, d) => {
    let data = JSON.parse(d);
    for (let i = 0; i < components.length; i++) {
        if (components[i].name == name) {
            for (const [key, value] of Object.entries(data)) {
                components[i][key] = value;
            }
        }
    }
    console.log(`Edit called for ${name}`);
})
ipcMain.on("createComponent", (event, component) => {
    components.push(component);
})


ipcMain.on("newJSFile", () => {
    let file = new File();
    files.push(file);
    console.log(files.length);
    graphicsWindow.window.webContents.send("newJSFile", file.name);
})

ipcMain.on("close", () => {
    graphicsWindow.window.close();
})

ipcMain.on("minimize", () => {
    graphicsWindow.window.minimize();
})

ipcMain.on("close_settings", () => {
    settingsWindow.window.close();
})

ipcMain.on("minimize_settings", () => {
    settingsWindow.window.minimize();
})

ipcMain.on("close_theme", () => {
    themesWindow.window.close();
})

ipcMain.on("minimize_theme", () => {
    themesWindow.window.minimize();
})


ipcMain.on("dev-refresh", () => {
    graphicsWindow.window.reload();
})

ipcMain.on("toggle-dev-tools", () => {

    // Toggle the DevTools visibility based on its current state
    if (devToolsOpened) {
        graphicsWindow.window.webContents.closeDevTools();
        devToolsOpened = false;
    } else {
        graphicsWindow.window.webContents.openDevTools();
        devToolsOpened = true;
    }
})

ipcMain.on("createFile", async () => {
    console.log("createFile called");
    let { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath: ``,
        filters: [
            { name: 'CreatEx Files', extensions: ['amk'] }
        ],
        buttonLabel: "Create"
    });
    if (canceled) return;
    let path = filePath;
    if (!path.endsWith('.amk')) {
        path += '.amk';
    }
    currentFile = path;
    fs.writeFile(path, '', (err) => {
        graphicsWindow.window.webContents.send("createFile", { status: (err == null), error: err })
    });
})

ipcMain.on("saveFile", () => {
    exportProject();
})

ipcMain.on("openFile", async () => {
    let result = await openProject();
    console.log("\n\nOPEN\n\n")
    console.log(result.value);
    console.log("\n\nEND OF OPEN\n\n")
    graphicsWindow.window.webContents.send("openFile", result);
})

ipcMain.on("buildFile", async () => {
    let result = await build();
    graphicsWindow.window.webContents.send("buildFile", result);
})

ipcMain.on("executeDropdown", (event, id) => {
    graphicsWindow.window.webContents.send(id, null);
})

ipcMain.on("upload", async () => {
    let { filePaths, canceled } = await dialog.showOpenDialog({
        defaultPath: ``,
        filters: [
            { name: 'MP4', extensions: ['mp4'] },
            { name: 'MP3', extensions: ['mp4'] },
            { name: 'PNG', extensions: ['png'] },
            { name: 'JPG', extensions: ['jpg', 'jpeg'] },
            { name: 'Any File', extensions: ['*'] },
        ],
        buttonLabel: "Upload"
    });
    if (canceled) {
        resolve({ result: false, value: 'Cancelled', license: licenseData });
        return;
    };

    filePaths.forEach(fp => {
        let path = fp.split("\\");
        path = path[path.length - 1];
        fs.copyFile(fp, `./dist/stored_images/${path}`, (err) => {
            console.log((err == null) ? `${fp} copied to ./dist/stored_images successfully.` : `${fp} couldn't be copied to ./dist/stored_images\n\tError: ${err}`);
        });
        graphicsWindow.window.webContents.send("notify", `${fp} uploaded`);
    })

})

ipcMain.on("toggleFullscreen", () => {
    graphicsWindow.window.setFullScreen(!graphicsWindow.window.isFullScreen());
})

ipcMain.on("settings", () => {
    console.log("Settings");
    if (settingsWindow == null) {
        settingsWindow = new GraphicsWindow('./dist/html/settings.html');
        settingsWindow.createWindow('./dist/html/settings.html', 400, 800, true);
        settingsWindow.window.once('closed', () => {
            settingsWindow = null;
        });
    } else {
        console.log("wtf");
    }
})

ipcMain.on("_copy", (ev, data) => {
    clipboard.writeText(`${data}`);
    graphicsWindow.window.webContents.send('_copy', `${clipboard.readText() == `${data}`}`);
})

ipcMain.on('getClipboard', () => {
    graphicsWindow.window.webContents.send("getClipboard", clipboard.readText());
})

async function getStoredFiles(directoryPath) {
    let fileList = [];
    let data = await util.promisify(fs.readdir)(directoryPath)
    return data;
}

ipcMain.on("get_stored_files", async () => {
    // Settings event
    let tmp_files = await getStoredFiles('./dist/stored_images/');
    console.log('Temp Files:', tmp_files);
    settingsWindow.window.webContents.send("get_stored_files", tmp_files);
})

function saveSettings() {
    fs.writeFile('./settings.json', JSON.stringify(settings, null, 2), () => { })
    graphicsWindow.window.webContents.send("notify", "Settings updated");
}

ipcMain.on("setIcon", (ev, iconPath) => {
    settings.icon = iconPath;
    saveSettings();
})

ipcMain.on("setname", (ev, name) => {
    settings.name = name;
    saveSettings();
})

ipcMain.on("setversion", (ev, version) => {
    settings.version = version;
    saveSettings();
})

ipcMain.on("setdescription", (ev, description) => {
    settings.description = description;
    saveSettings();
})

ipcMain.on("setauthor", (ev, author) => {
    settings.author = author;
    saveSettings();
})

ipcMain.on("setallthemes", (ev, themes) => {
    settings.themes = themes;
    saveSettings();
})

ipcMain.on("settheme", (ev, theme) => {
    settings.theme = theme;
    saveSettings();
})

ipcMain.on("applyTheme", () => {
    graphicsWindow.window.webContents.send("applyTheme");
})

ipcMain.on("getname", () => {
    settingsWindow.window.webContents.send("getname", settings.name);
})

ipcMain.on("geticon", () => {
    settingsWindow.window.webContents.send("geticon", settings.icon);
})

ipcMain.on("getversion", () => {
    settingsWindow.window.webContents.send("getversion", settings.version);
})

ipcMain.on("getdescription", () => {
    settingsWindow.window.webContents.send("getdescription", settings.description);
})

ipcMain.on("getauthor", () => {
    settingsWindow.window.webContents.send("getauthor", settings.author);
})

ipcMain.on("getallthemes", () => {
    settingsWindow.window.webContents.send("getallthemes", settings.themes);
})

ipcMain.on("gettheme", () => {
    settingsWindow.window.webContents.send("gettheme", settings.theme);
})

ipcMain.on("getcurrenttheme", () => {
    graphicsWindow.window.webContents.send("getcurrenttheme", settings.theme);
})

ipcMain.on("getthemes", () => {
    graphicsWindow.window.webContents.send("getthemes", settings.themes);
})

ipcMain.on("getthemes_themes", () => {
    themesWindow.window.webContents.send("getthemes_themes", settings.themes);
})

ipcMain.on("get_theme_by_name", (ev, name) => {
    themesWindow.window.webContents.send("get_theme_by_name", settings.themes[name]);
})

ipcMain.on("modifyThemes", () => {
    if (themesWindow == null) {
        themesWindow = new GraphicsWindow('./dist/html/themes.html');
        themesWindow.createWindow('./dist/html/themes.html', 800, 800, false);
        themesWindow.window.once('closed', () => {
            themesWindow = null;
        });
    }
})

ipcMain.on("modify-theme-attribute", (ev, d) => {
    let { theme, attr, value } = d;
    settings.themes[theme][attr] = value;
    saveSettings();
})


ipcMain.on("debug", async (ev) => {
    if (debugWindow == null) {
        debugWindow = new GraphicsWindow('./dist/html/debug.html', 400, 800, true);
        await debugWindow.createWindow('./dist/html/debug.html', 400, 800, true);
        debugWindow.window.once('closed', () => {
            debugWindow = null;
        })
    }
})

ipcMain.on("getfiles_indirectory", async (ev, mypath) => {
    function getFilesInDirectory(directoryPath) {
        return new Promise((resolve, reject) => {
            fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    reject(err);

                } else {
                    const filePaths = files.map(file => path.join(directoryPath, file));
                    resolve(filePaths);
                }
            });
        });
    }
    graphicsWindow.window.webContents.send("getfiles_indirectory", await getFilesInDirectory(mypath))
})

ipcMain.on("notify", (ev, message, color) => {
    console.log("notify", message, color);
    graphicsWindow.window.webContents.send("notify", message, color);
})

ipcMain.on("redisplay", (ev, properties) => {
    if (debugWindow != null) {
        debugWindow.window.webContents.send("redisplay", properties);
    }
})










app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});