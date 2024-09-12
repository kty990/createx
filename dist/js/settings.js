const xx = document.getElementById("closee");
const minimize = document.getElementById("min");
xx.addEventListener("click", () => {
    window.api.send("close_settings");
})

minimize.addEventListener("click", () => {
    window.api.send("minimize_settings");
})


const iconInput = document.getElementsByClassName("iconinput")[0];

iconInput.addEventListener("click", () => {
    let desc = document.createElement("div");
    desc.classList.add("description");
    let p = document.createElement("p");
    p.textContent =
})