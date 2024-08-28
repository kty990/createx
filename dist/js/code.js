const code_storage = {
    files: [],
    visual: document.getElementById("code-editor"),
    directory: document.getElementById("directory"),
    newFileButton: document.getElementById("apply")
}

function removeAll() {
    code_storage.directory.innerHTML = "";
}

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