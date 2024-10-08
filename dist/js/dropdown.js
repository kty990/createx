// HANDLE DROPDOWN METHODS FOR TITLE BAR

function removeAll() {
    directory.innerHTML = "";
}

function refreshAll() {
    removeAll();
    dragdrop.style.zIndex = '2';
    codeEditor.style.zIndex = '1';
    propertyApply.querySelector("p").textContent = "Apply"
    Plabel.querySelector("p").textContent = "Properties";
    document.getElementById("comp-type").style.visibility = 'visible';

    dragdrop.innerHTML = ``;
    codeEditor.innerHTML = ``; // Reset code editor
}

/*** FILE ***/

window.api.on("new", async () => {
    // Display new file window to get path (window.api.invoke)
    // Create new file at directory ^same invoke as above
    console.log("New received on client...");
    const fileData = window.api.invoke("createFile");
    // Open blank project, store file path to save to later (stored on main process via invoke above, clear drag-drop display, clear code menu, reset properties)
    refreshAll();
})

window.api.on("open", () => {
    // Display open file window to get path
    const fileData = window.api.invoke("openFile");
    // Open project, load components
    refreshAll();
    // Load components
})

window.api.on("save", () => {
    // Display save file window to get path
    // Save file via main process (window.api.send)
    window.api.send("saveFile");
})

window.api.on("build", () => {
    // Display open file window to get path
    // Build application from file
    const status = window.api.invoke("buildFile");
    console.warn('Build Status:', status);
    // Display notification for status of build, or open popup to display messages as build is running / completed
})

window.api.on("settings", () => {
    // Open another window
    window.api.send("settings");
})

window.api.on("upload", () => {
    // Open another window
    window.api.send("upload");
})




/*** EDIT ***/

// cut,copy,paste handled in home.js




/*** VIEW ***/

// fullscreen
window.api.on("fullscreen", () => {
    window.api.send("toggleFullscreen");
})

window.api.on("debug", () => {
    window.api.send("debug");
})


/*** COMPONENTS ***/

// Group, Ungroup done in home.js