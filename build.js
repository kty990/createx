// Create the build process here and export a function or class

const electronPackager = require('electron-packager');
const { dialog } = require('electron');
const fs = require('fs');

class Event {
    callbacks = {};
    constructor() { }
    fire(channel, ...args) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].forEach(c => c(...args));
        _action.fire(channel, ...args);
    }
    /**
     * 
     * @param {function(...*)} cb 
     */
    receive(channel, cb) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].push(cb);
    }

    invoke(channel) {
        return new Promise((resolve) => {
            const r = (...args) => {
                _action.removeCallback(channel, r);
                resolve(...args);
            }
            _action.receive(channel, r);
            _action.fire(channel);
        })
    }


    /**
     * @param {function(...*)} cb
     */
    removeCallback(channel, cb) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
            return; // Nothing to remove in this instance
        }
        this.callbacks[channel].splice(this.callbacks.indexOf(cb), 1);
    }
}

var _action = new Event();

const indexjs = `class GraphicsWindow {
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
            const NOTIFICATION_BODY = \`\${e}\`

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
                preload: path.join(__dirname, './js/preload.js')
            },
        });

        // Set the window icon
        //(REPLACE)

        const menu = Menu.buildFromTemplate([]);
        Menu.setApplicationMenu(menu);

        this.window.setMenu(menu);

        this.window.loadFile('./html/index.html');

        this.window.on('closed', () => {
            this.window = null;
        });
    }
}

const graphicsWindow = new GraphicsWindow();`

const ActionEvent = new Event();

/**
 * 
 * @returns {Promise<String>} Build success as string
 */
async function build() {
    let { filePaths, canceled } = await dialog.showOpenDialog({
        defaultPath: ``,
        filters: [
            { name: 'CreatEx Files', extensions: ['amk'] }
        ],
        buttonLabel: "Build Win Project"
    });

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

    const jsFiles = await ActionEvent.invoke('get_js_files');
    const components = await ActionEvent.invoke("get_components");

    // Generate temporary directory for building process : TODO (DONE)
    // Get code for index.html, index.css, index.js : TODO

    function compileCSS() {
        const classes = {}
        const compiled = {}
        let count = 0;
        for (let x = 0; x < components.length; x++) {
            let _class = {};
            for (let [property, value] of Object.entries(components[x])) {
                if (['name', 'type'].includes(property.toLowerCase())) {
                    continue;
                }
                _class[property] = value;
            }
            let CLASS_SET = false;
            for (const [c, properties] of Object.entries(classes)) {
                let found = c;
                for (const [key, value] of Object.entries(properties)) {
                    if (_class[key] != undefined && _class[key] != null) {
                        if (_class[key] != value) {
                            found = null;
                            break;
                        }
                    } else {
                        found = null;
                        break;
                    }
                }
                if (found != null) {
                    compiled[`${x}`] = found;
                    CLASS_SET = true;
                    break;
                }
            }
            if (!CLASS_SET) {
                let cc = `count_${++count}`;
                classes[cc] = properties;
                compiled[`${x}`] = cc;
            }
        }
        return { classes, compiled };
    }

    function compileHTMLfromCSS(css) {
        let { classes, compiled } = css;
        let result = "";
        for (const [index, _class] of Object.entries(compiled)) {
            let e = components[parseInt(index)];
            result += `<${e.type} class='${_class}'>${(e.textContent != null && e.textContent != undefined) ? e.textContent : ''}</${e.type}>\n`;
        }
        for (const file of jsFiles) {
            let data = file.code;
            result += `<script src="./temp/${formattedDate}/js/${file.name}.js"></script>\n` // Linking JS
        }
        return result;
    }

    function recompileCSS(css) {
        let { classes } = css;

        let result = '';
        for (const [_class, propertyObj] of Object.entries(classes)) {
            let str_class = `.${_class} {`;
            for (const [property, value] of Object.entries(propertyObj)) {
                str_class += `${property.replace("_", "-")}:${value};`;
            }
            str_class += "}"
            result += str_class + "\n"
        }
        return result;
    }

    let css = compileCSS();
    const _html = `<!DOCTYPE html>
    <html>
    <head>
    <link rel='stylesheet' href='../css/index.css'>
    </head>
    <body>
    ${compileHTMLfromCSS(css)}
    </body>
    </html>`


    let iconPath = await util.promisify(fs.read)('./icon.txt');
    fs.copyFile(`./dist/stored_images/${iconPath}`, `./temp/${formattedDate}/${iconPath}`, (err) => { });
    indexjs = indexjs.replace("//(REPLACE)", `const iconPath = path.join(__dirname, './${iconPath}');
        this.window.setIcon(iconPath);`)
    fs.writeFile(`./temp/${formattedDate}/html/index.html`, _html, (err) => { });
    fs.writeFile(`./temp/${formattedDate}/css/index.css`, recompileCSS(css), (err) => { });
    fs.writeFile(`./temp/${formattedDate}/index.js`, indexjs, (err) => { });
    //index.js >> files (const)
    for (const file of jsFiles) {
        let data = file.code;
        fs.writeFile(`./temp/${formattedDate}/js/${file.name}.js`, data, (err) => { });
    }

    return new Promise((resolve) => {
        if (canceled) resolve('Packaging failed: Build process cancelled');
        let result = '<err>';
        electronPackager(`./temp/${formattedDate}`, {
            platform: 'win32',
            arch: 'x64',
            out: 'packaged_files',
            name: `${filePaths[0].split(".")[0]}`,
            version: '1.0.0', // This probably should have a dynamic component in the future
            icon: './dist/images/icon.png',

            win: {
                manufacturer: 'Ty Kutcher'
            }
        })
            .then(() => {
                result = 'Packaging completed!';
            })
            .catch((error) => {
                result = `Packaging failed: ${error}`;
            })
            .finally(() => {
                // Remove temporary directory
                fs.rm("./temp", { recursive: true, force: true }, (err) => {
                    resolve(result);
                })
            });
    })
}

module.exports = { build, ActionEvent };