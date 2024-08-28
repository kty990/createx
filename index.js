const { app, BrowserWindow, Menu, dialog, ipcMain, autoUpdater, shell } = require('electron');
const path = require('path');
const fs = require('fs');

var licenseData;

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
                preload: path.join(__dirname, './dist/js/preload.js'),
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
        defaultPath: `${year}_${month}_${day} -${hour}_${minute}_${second} `,
        filters: [
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    // Create export folder with format yyyy_dd_mm-hh_mm_ss
    fs.mkdir(`${filePath.split(".")[0]}/license.md`, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully!');

        }
    });
    fs.writeFile(`${filePath.split(".")[0]}/license`, licenseData);

    // Generate html,css,js,images,misc folders
    fs.mkdir(`${filePath.split(".")[0]}/src/html`, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully!');

        }
    });
    fs.mkdir(`${filePath.split(".")[0]}/src/css`, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully!');

        }
    });
    fs.mkdir(`${filePath.split(".")[0]}/src/js`, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully!');

        }
    });
    fs.mkdir(`${filePath.split(".")[0]}/resources/images`, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully!');

        }
    });
    fs.mkdir(`${filePath.split(".")[0]}/resources/sounds`, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating folder:', err);
        } else {
            console.log('Folder created successfully!');

        }
    });

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
        for (const [key, value] of Object.entries(comp.properties)) {
            stylized += `${key}:${value};`
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

    // Populate folders
    // HTML

    // CSS

    // JS
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});