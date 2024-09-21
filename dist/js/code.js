const keywords = {};
const code_storage = {
    files: [],
    visual: document.getElementById("editor"),
    tab: document.getElementById("code"),
    directory: document.getElementById("directory"),
    newFileButton: document.getElementById("apply")
}

/**
 * @returns {undefined}
 */
function removeAll() {
    code_storage.directory.innerHTML = "";
}

/**
 * @returns {undefined}
 */
function displayFiles() {
    removeAll();
    for (let file of code_storage.files) {
        let tmp = document.createElement("div");
        tmp.classList.add('property');
        let name = document.createElement("p");
        name.textContent = file;
        tmp.appendChild(name);
        code_storage.directory.appendChild(tmp);
    }
}

/**
 * Add a new 'file' in storage, in directory
 */
code_storage.newFileButton.addEventListener("click", async () => {
    if (code_storage.visual.style.zIndex == "1") return; // Not active
    let newFile = await window.api.invoke("newJSFile");
    code_storage.files.push(newFile);
    code_storage.files = code_storage.files.sort(c => {
        // This will have to be changed when the user can modify the name of the files, if they can
        let n = c.split(" ")[1];
        n = parseInt(n);
        return n;
    });
    console.log(code_storage.files);
    displayFiles();
})

code_storage.tab.addEventListener("click", () => {
    displayFiles();
})


async function getKeywords() {
    return new Promise(async (resolve) => {
        let files = await window.api.invoke("getfiles_indirectory", './dist/js/');
        for (let file of files) {
            let f = file.split("\\");
            f = f[2];
            if (!['home.js'].includes(f)) continue;
            import(`./${f}`).then(imp => {
                // Get keywords from import
                for (const [property, value] of Object.entries(imp)) {
                    keywords[property] = [];
                    let test = new value();
                    var propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(test));
                    if (test.destroy) {
                        test.destroy();
                    }
                    for (const [p, v] of Object.entries(test)) {
                        keywords[property].push({ type: 'property', name: p, value: v })
                    }
                    for (let funcName of propertyNames) {
                        if (funcName != "constructor") {
                            keywords[property].push({ type: 'function', value: funcName })
                        }
                    }
                }
            }).catch((e) => {
                console.error(e);
            }).finally(() => {
                resolve()
            })
        }
    })
}

getKeywords();



// Auto-fill suggestions

/**
 * TODO: Modify this so if a selection is not present, get the word closest, and take in 'typing' boolean arg
 * @returns {string}
 */
function getCurrentSelectionWord() {
    return window.getSelection().toString();
}

/**
 * Get the cursor position on the screen for the auto-fill suggestion box to go underneath
 */
function getCursorPosition() {
    // Get the cursor position within the textEditable element
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // Get the element's position relative to the window
    const rect = element.getBoundingClientRect();

    // Calculate the cursor position relative to the window
    const cursorX = rect.left + range.getClientRect(0).left;
    const cursorY = rect.top + range.getClientRect(0).top;

    return { x: cursorX, y: cursorY };
}

