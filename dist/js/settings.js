const xx = document.getElementById("closee");
const minimize = document.getElementById("min");
xx.addEventListener("click", () => {
    window.api.send("close_settings");
})

minimize.addEventListener("click", () => {
    window.api.send("minimize_settings");
})