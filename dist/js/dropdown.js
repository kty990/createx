// HANDLE DROPDOWN METHODS FOR TITLE BAR

/*** FILE ***/

window.api.on("new", () => {
    // Display new file window to get path (window.api.invoke)
    // Create new file at directory ^same invoke as above
    // Open blank project, store file path to save to later (stored on main process via invoke above, clear drag-drop display, clear code menu, reset properties)
})

window.api.on("open", () => {
    // Display open file window to get path
    // Open project, load components
})

window.api.on("save", () => {
    // Display save file window to get path
    // Save file via main process (window.api.send)
})

window.api.on("build", () => {
    // Display open file window to get path
    // Build application from file
})




/*** EDIT ***/

// cut,copy,paste
window.api.on("cut", () => {
    // Get current selected element
    // Store the element as a JSON string
    // Store the element string to keyboard (window.api.send)
    // Delete element from drag-drop and from local memory
})

window.api.on("copy", () => {
    // Get current selected element
    // Store the element as a JSON string
    // Store the element string to keyboard (window.api.send)
})

window.api.on("paste", () => {
    // Check if the keyboard contains a valid component in format JSON string
    // Load component from keyboard
})



/*** VIEW ***/

// fullscreen