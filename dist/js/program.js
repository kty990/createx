const x = document.getElementById("close");
const mm = document.getElementById("minimize");

x.addEventListener("click", () => {
    window.api.send("close");
})

mm.addEventListener("click", () => {
    window.api.send("minimize");
})

document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.key.toLowerCase() === "r") {
        window.api.send("dev-refresh");
    } else if (ev.ctrlKey && ev.key.toLowerCase() == "t") {
        window.api.send("toggle-dev-tools");
    }
});