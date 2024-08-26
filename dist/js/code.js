const code_storage = {
    code: "",
    visual: document.getElementById("code-editor"),
    formatButton: document.getElementById("apply")
}

code_storage.formatButton.addEventListener("click", async () => {
    if (code_storage.visual.style.zIndex == "1") return; // Not active
    code_storage.code = code_storage.visual.textContent;
    let hcode = await window.api.invoke("getHighlightedCode", code_storage.code);
    console.log(hcode);
    code_storage.visual.innerHTML = hcode;
})