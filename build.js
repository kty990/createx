// Create the build process here and export a function or class

const electronPackager = require('electron-packager');
const { dialog } = require('electron');
const fs = require('fs');

class Event {
    callbacks = {};
    _action = new Event();
    constructor() { }
    fire(channel, ...args) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].forEach(c => c(...args));
        this._action.fire(channel, ...args);
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
                this._action.removeCallback(channel, r);
                resolve(...args);
            }
            this._action.receive(channel, r);
            this._action.fire(channel);
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


    fs.writeFile(`./temp/${formattedDate}/html/index.html`, "", (err) => { });
    fs.writeFile(`./temp/${formattedDate}/css/index.css`, recompileCSS(css), (err) => { });
    fs.writeFile(`./temp/${formattedDate}/js/index.js`, "", (err) => { });
    //index.js >> files (const)
    for (const file of jsFiles) {
        let data = file.code;
        fs.writeFile(`./temp/${formattedDate}/js/${file.name}.js`, data, (err) => { });
    }

    return new Promise((resolve) => {
        if (canceled) resolve('Packaging failed: Build process cancelled');
        let result = '<err>';
        electronPackager('.', { // MODIFY THIS: Build path will be a temporary file created for the purpose of building
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