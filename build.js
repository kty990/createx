// Create the build process here and export a function or class

const electronPackager = require('electron-packager');
const { dialog } = require('electron');

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
    return new Promise((resolve) => {
        if (canceled) resolve('Packaging failed: Build process cancelled');
        electronPackager('.', {
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
                resolve('Packaging completed!');
            })
            .catch((error) => {
                resolve(`Packaging failed: ${error}`);
            });
    })
}

module.exports = { build };