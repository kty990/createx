const xx = document.getElementById("closee");
const minimize = document.getElementById("min");
xx.addEventListener("click", () => {
    window.api.send("close_settings");
})

minimize.addEventListener("click", () => {
    window.api.send("minimize_settings");
})


const iconInput = document.getElementsByClassName("iconinput")[0];
const settings_files = document.getElementById("settings_files");

iconInput.addEventListener("click", async () => {
    // TODO: Handle showing only stored images
    settings_files.innerHTML = "";
    const make = (txt) => {
        // <div class="file">
        //     <p>TEST_FILE.ext</p>
        // </div>
        let d = document.createElement("div");
        d.classList.add('file');
        let p = document.createElement('p');
        p.textContent = txt;
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
                } else {
                    f.style.color = 'var(--selected)';
                }
            }
            window.api.send("setIcon", file);
        })
        settings_files.appendChild(e);
    }
})