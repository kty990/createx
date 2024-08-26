const code_storage = {
    files: [],
    visual: document.getElementById("code-editor"),
    directory: document.getElementById("properties"),
    formatButton: document.getElementById("apply")
}

function removeAll() {
    const elementsToRemove = code_storage.directory.querySelectorAll(":not(span)");

    elementsToRemove.forEach(element => {
        if (element.parentNode !== null && element.parentNode !== undefined) {
            // Skip if the parent is a span
            if (element.parentNode.nodeName.toLowerCase() === "span") {
                return;
            }
        }
        element.remove();
    });
}

function displayFiles() {
    removeAll();
    for (let file of code_storage.files) {
        let tmp = document.createElement("div");
        tmp.classList.add('property');
        let name = document.createElement("p");
        name.textContent = file;
        tmp.appendChild(name);
        code_storage.directory.insertBefore(tmp, code_storage.formatButton);
    }
}

/**
 * Add a new 'file' in storage, in directory
 */
code_storage.formatButton.addEventListener("click", async () => {
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