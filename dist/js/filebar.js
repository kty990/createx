const titleBar = document.getElementsByClassName("title-bar")[0];

const file = titleBar.querySelector("#file");
const edit = titleBar.querySelector("#edit");
const view = titleBar.querySelector("#view");

const values = [file, edit, view];

var lastActive = null;

values.forEach(value => {
    value.querySelector('div').querySelector('p').addEventListener("mouseenter", (e) => {
        value.querySelector('div').querySelector('p').style.color = "var(--text-hover)";
        value.querySelector('div').querySelector('p').style.cursor = "pointer";
    })

    value.querySelector('div').querySelector('p').addEventListener("mouseleave", (e) => {
        value.querySelector('div').querySelector('p').style.color = "var(--text)";
        value.querySelector('div').querySelector('p').style.cursor = null;
    })

    value.querySelector('div').querySelector('p').addEventListener("click", () => {
        let open = value.querySelector('.dropdown').style.visibility != 'visible';
        if (lastActive != null) {
            lastActive.querySelector('.dropdown').style.visibility = 'hidden';
        }
        value.querySelector(".dropdown").style.visibility = (open) ? 'visible' : 'hidden';
        lastActive = value;
    })

    Array.from(value.querySelector('.dropdown').children).forEach(v => {
        console.warn("Activating", v.id);
        v.addEventListener("click", () => {
            window.api.send("executeDropdown", v.id);
            let open = value.querySelector('.dropdown').style.visibility != 'visible';
            if (lastActive != null) {
                lastActive.querySelector('.dropdown').style.visibility = 'hidden';
            }
            value.querySelector(".dropdown").style.visibility = (open) ? 'visible' : 'hidden';
            lastActive = null;
        })

    })
})