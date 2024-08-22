const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => {
            try {
                func(...args);
            } catch (e) {
                console.error(e);
                console.log(`^^ ${channel}`);
            }
        });
    },
    on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => {
            try {
                func(...args);
            } catch (e) {
                console.error(e);
                console.log(`^^ ${channel}`);
            }
        });
    },
    once: (channel, func) => {
        ipcRenderer.once(channel, (event, ...args) => {
            func(...args);
        });
    },
    invoke: (channel, data) => {

        return new Promise((resolve, reject) => {
            ipcRenderer.send(channel, data);
            ipcRenderer.once(channel, (event, ...args) => {
                console.log(...args);
                resolve(...args);
            });
        })
    }
});