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
const versionInput = document.getElementsByClassName("versioninput")[0];
const descriptionInput = document.getElementsByClassName("descriptioninput")[0];
const authorInput = document.getElementsByClassName("authorinput")[0];
const themeInput = document.getElementsByClassName("themeinput")[0];
const settings_files = document.getElementById("descriptions");

const data = {};

async function setTheme() {
    const setTheme = (name, value) => {
        document.documentElement.style.setProperty(`--${name}`, value);
    }

    let theme = data.theme;
    let themes = data.themes;
    for (const [name, values] of Object.entries(themes)) {
        if (name == theme) {
            for (const [key, value] of Object.entries(values)) {
                setTheme(key, value);
            }
        }
    }
}

main_logic = async () => {
    data.name = await window.api.invoke("getname");
    data.icon = await window.api.invoke("geticon");
    data.version = await window.api.invoke("getversion");
    data.description = await window.api.invoke("getdescription");
    data.author = await window.api.invoke("getauthor");
    data.themes = await window.api.invoke("getallthemes");
    data.theme = await window.api.invoke('gettheme');
    nameInput.value = data.name || "";
    versionInput.value = data.version || "";
    descriptionInput.value = data.description || "";
    authorInput.value = data.author || "";
    setTheme();
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

themeInput.addEventListener("click", async () => {
    settings_files.innerHTML = "";
    const make = (txt, colorsDictionary) => {
        let d = document.createElement("div");
        d.classList.add('description');
        let p = document.createElement('p');
        p.textContent = txt;
        d.appendChild(p);
        for (const [key, value] of Object.entries(colorsDictionary)) {
            let t = document.createElement("p");
            t.textContent = key;
            t.style.backgroundColor = value;
            t.style.fontWeight = 'bold';
            t.style.textShadow = '0px 0px 3px rgba(0, 0, 0, 1), 0px 0px 3px rgba(0, 0, 0, 1)';
            t.style.textAlign = 'center';

            t.style.borderRadius = '20px';
            t.style.borderColor = 'var(--interaction-border)';
            t.style.borderStyle = 'solid';
            t.style.borderWidth = '2px';
            d.appendChild(t);
        }
        if (txt == data.theme) {
            d.style.borderColor = 'var(--selected)';
        }
        return d;
    }
    data.themes = await window.api.invoke("getallthemes");
    let elements = [];
    for (const [key, value] of Object.entries(data.themes)) {
        let e = make(key, value);
        elements.push(e);
        e.addEventListener("click", () => {
            data.theme = key;
            window.api.send("settheme", key);
            setTheme();
            for (let f of elements) {
                if (f != e) {
                    // f.style.color = null;
                    f.style.borderColor = null;
                } else {
                    // f.style.color = 'var(--selected)';
                    f.style.borderColor = 'var(--selected)';
                }
            }
            window.api.send("applyTheme");
        })
        settings_files.appendChild(e);
    }
})

nameInput.addEventListener("input", () => {
    window.api.send("setname", nameInput.value);
})

versionInput.addEventListener("input", () => {
    window.api.send("setversion", versionInput.value);
})

descriptionInput.addEventListener("input", () => {
    window.api.send("setdescription", descriptionInput.value);
})

authorInput.addEventListener("input", () => {
    window.api.send("setauthor", authorInput.value);
})

window.addEventListener("DOMContentLoaded", () => {
    main_logic();
})