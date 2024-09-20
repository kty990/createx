let element = document.getElementById("debug_flex");

window.api.on("redisplay", (dict) => {
    element.innerHTML = "";
    for (const [key, value] of Object.entries(dict)) {
        let tmp = document.createElement("div");
        tmp.style.setProperty("display", "flex");
        let name = document.createElement("p");
        name.textContent = `${key}: ${value}`;
        name.style.setProperty("width", "100%")
        tmp.appendChild(name);
        element.appendChild(tmp);
    }
})