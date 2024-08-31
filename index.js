const { app, BrowserWindow, Menu, dialog, ipcMain, autoUpdater, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util');

var licenseData;
var currentFile;

fs.readFile("./license.md", (err, data) => {
    licenseData = data;
})

let devToolsOpened = false;

class GraphicsWindow {
    constructor() {
        try {
            this.window = null;
            this.current_z_index = 0;
            this.layers = []; // List to store layers
            this.active_layer = null; // Currently active layer

            this.currentProject = null;

            app.on('ready', async () => {
                await this.createWindow();
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

    async createWindow() {
        this.window = new BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 800,   // Set the minimum width
            minHeight: 600,  // Set the minimum height
            frame: false, // Remove the default window frame (including the title bar)
            webPreferences: {
                nodeIntegration: true,
                spellcheck: false,
                preload: path.join(__dirname, './dist/js/preload.js')
            },
        });

        // Set the window icon
        const iconPath = path.join(__dirname, './dist/images/icon.png');
        this.window.setIcon(iconPath);

        const menu = Menu.buildFromTemplate([]);
        Menu.setApplicationMenu(menu);

        this.window.setMenu(menu);

        this.window.loadFile('./dist/html/index.html');

        this.window.on('closed', () => {
            this.window = null;
        });
    }
}

const graphicsWindow = new GraphicsWindow();

const components = [
    // {
    //     name: "",
    //     type: "",
    //     left:0,
    //     top:0,
    //     width:0,
    //     height:0,
    //     properties:{}
    // }
]
const files = [

];

class File {
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


// This has to be updated for .amk format
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
        return !singleTagged.includes(type.toLowerCase());
    }

    const make = (comp) => {
        let stylized = "";
        for (const [key, value] of Object.entries(comp)) {
            if (key != 'name') {
                stylized += `${key}:${value};`
            }
        }
        stylized += `left:${comp.left}`;
        stylized += `top:${comp.top}`;
        stylized += `width:${comp.width}`;
        stylized += `height:${comp.height}`;
        let e = `<${comp.type} style="${stylized}"></${comp.type}>`;
        if (!isDoubleTagged(comp.type)) {
            e.replace(`</${comp.type}>`, "");
        }
        return e;
    }

    let allComps = [];
    for (const comp of components) {
        console.log("comp")
        console.log(comp);
        let strComp = make(comp);
        allComps.push(strComp);
    }

    let result = allComps.join("\n");

    result += `\n(LICENSE): ${licenseData}`;

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
 * @returns {{result: Boolean, value: String, license: String}}
 */
async function openProject() {
    function binaryToString(binaryString) {
        let binaryChunks = binaryString.split(" ")
        let asciiChars = binaryChunks.map(chunk => String.fromCharCode(parseInt(chunk, 2)));

        // Join characters into a string
        return asciiChars.join('');
    }
    let { filePaths, canceled } = await dialog.showOpenDialog({
        defaultPath: ``,
        filters: [
            { name: 'CreatEx Files', extensions: ['amk'] }
        ],
        buttonLabel: "Open Project"
    });
    if (canceled) return;
    const data = await util.promisify(fs.readFile)(filePaths[0]);
    let tmp_v = binaryToString(data.toString());
    let v = tmp_v.split("(LICENSE): ")[0];
    let license = tmp_v.split("(LICENSE): ")[1];
    console.log('v', v);
    console.log('license', license);
    return { result: data instanceof Buffer, value: v, license }
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
ipcMain.on("close", () => {
    graphicsWindow.window.close();
})

ipcMain.on("newJSFile", () => {
    let file = new File();
    files.push(file);
    console.log(files.length);
    graphicsWindow.window.webContents.send("newJSFile", file.name);
})

ipcMain.on("minimize", () => {
    graphicsWindow.window.minimize();
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

ipcMain.on("executeDropdown", (event, id) => {
    graphicsWindow.window.webContents.send(id, null);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});