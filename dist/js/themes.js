const xx = document.getElementById("closee");
const minimize = document.getElementById("min");
xx.addEventListener("click", () => {
    window.api.send("close_theme");
})

minimize.addEventListener("click", () => {
    window.api.send("minimize_theme");
})

class Event {
    callbacks = {};
    constructor() { }
    fire(channel, ...args) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].forEach(c => c(...args));
        _action.fire(channel, ...args);
    }
    /**
     * 
     * @param {function(...*)} cb 
     */
    receive(channel, cb) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].push(cb);
    }

    invoke(channel) {
        return new Promise((resolve) => {
            const r = (...args) => {
                _action.removeCallback(channel, r);
                resolve(...args);
            }
            _action.receive(channel, r);
            _action.fire(channel);
        })
    }


    /**
     * @param {function(...*)} cb
     */
    removeCallback(channel, cb) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
            return; // Nothing to remove in this instance
        }
        this.callbacks[channel].splice(this.callbacks[channel].indexOf(cb), 1);
    }
}

const mainEvent = new Event();

const themes = document.getElementById("themes");


const options = document.getElementsByClassName("option");
var currentThemeName = null;

Array.from(options).forEach(o => {
    o.querySelector("input").addEventListener("change", () => {
        if (currentThemeName != null) {
            mainEvent.fire('modification', o);
        }
    })
})

mainEvent.receive("modification", obj => {
    let data = {
        theme: currentThemeName,
        attr: obj.querySelector("p").textContent.replace(" ", "-").toLowerCase(),
        value: obj.querySelector("input").value
    };
    window.api.send("modify-theme-attribute", data)
})

async function select(element, themeName) {
    currentThemeName = themeName;
    let themeFromName = await window.api.invoke("get_theme_by_name", themeName); // Only the properties
    element.style.borderColor = 'var(--selected)';
    for (let option of options) {
        let p = option.querySelector('p');
        let input = option.querySelector("input");
        if (p.textContent == "Body") {
            input.value = themeFromName.body;
        } else if (p.textContent == "Interaction") {
            input.value = themeFromName.interaction;
        } else if (p.textContent == "Interaction Border") {
            input.value = themeFromName['interaction-border'];
        } else if (p.textContent == "Element") {
            input.value = themeFromName.element;
        } else if (p.textContent == "Text") {
            input.value = themeFromName.text;
        } else if (p.textContent == "Text Hover") {
            input.value = themeFromName['text-hover'];
        } else if (p.textContent == "Selected") {
            input.value = themeFromName.selected;
        }
    }
}

async function init() {
    try {
        let allThemes = await window.api.invoke("getthemes_themes");
        themes.innerHTML = "";
        const make = (txt, colorsDictionary) => {
            // alert(`Making ${txt}`);
            let d = document.createElement("div");
            d.classList.add('theme');
            let p = document.createElement('p');
            p.style.width = '100%';
            p.style.margin = '0';
            p.style.padding = '0';
            p.style.textAlign = 'center';
            p.style.backgroundColor = '#000';
            p.style.borderColor = "#fff";
            p.style.borderStyle = 'solid';
            p.style.textTransform = 'uppercase';
            p.style.marginBottom = '30px';
            p.style.borderWidth = '2px';
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
            return d;
        }
        let elements = [];
        for (const [key, value] of Object.entries(allThemes)) {
            let e = make(key, value);
            e.addEventListener("click", () => {
                try {
                    // alert(`Selected ${key}`);
                    select(e, key);
                } catch (err) {
                    alert(err);
                }
            })
            elements.push(e);
            themes.appendChild(e);
        }
    } catch (e) {
        alert(e);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    init();
})