const xx = document.getElementById("closee");
const minimize = document.getElementById("min");
xx.addEventListener("click", () => {
    window.api.send("close_settings");
})

minimize.addEventListener("click", () => {
    window.api.send("minimize_settings");
})


const iconInput = document.getElementsByClassName("iconinput")[0];
const nameInput = document.getElementsByClassName("nameinput")[0];
const settings_files = document.getElementById("descriptions");

const data = {};

main_logic = async () => {
    data.name = await window.api.invoke("getname");
    data.icon = await window.api.invoke("geticon");
    nameInput.value = data.name;
}

iconInput.addEventListener("click", async () => {
    // TODO: Handle showing only stored images
    try {
        settings_files.innerHTML = "";
        const make = (txt) => {
            let d = document.createElement("div");
            d.classList.add('description');
            let p = document.createElement('p');
            p.textContent = txt;
            if (txt == data.icon) {
                d.style.color = 'var(--selected)';
                d.style.borderColor = 'var(--selected)';
            }
            d.appendChild(p);
            return d;
        }
        let files = await window.api.invoke('get_stored_files');
        let elements = [];
        for (let file of files) {
            let e = make(file);
            elements.push(e);
            e.addEventListener("click", () => {
                for (let f of elements) {
                    if (f != e) {
                        f.style.color = null;
                        f.style.borderColor = null;
                    } else {
                        f.style.color = 'var(--selected)';
                        f.style.borderColor = 'var(--selected)';
                    }
                }
                window.api.send("setIcon", file);
            })
            settings_files.appendChild(e);
        }
    } catch (e) {
        alert(e);
    }
})

nameInput.addEventListener("input", () => {
    window.api.send("setname", nameInput.value);
})

window.addEventListener("DOMContentLoaded", () => {
    main_logic();
})