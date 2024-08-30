const titleBar = document.getElementsByClassName("title-bar")[0];

const file = titleBar.querySelector("#file");
const edit = titleBar.querySelector("#edit");
const view = titleBar.querySelector("#view");

file.querySelector('div').querySelector('p').addEventListener("mouseenter", (e) => {
    file.querySelector('div').querySelector('p').style.color = "var(--text-hover)";
    file.querySelector('div').querySelector('p').style.cursor = "pointer";
})

file.querySelector('div').querySelector('p').addEventListener("mouseleave", (e) => {
    file.querySelector('div').querySelector('p').style.color = "var(--text)";
    file.querySelector('div').querySelector('p').style.cursor = null;
})

edit.querySelector('div').querySelector('p').addEventListener("mouseenter", (e) => {
    edit.querySelector('div').querySelector('p').style.color = "var(--text-hover)";
    edit.querySelector('div').querySelector('p').style.cursor = "pointer";
})

edit.querySelector('div').querySelector('p').addEventListener("mouseleave", (e) => {
    edit.querySelector('div').querySelector('p').style.color = "var(--text)";
    edit.querySelector('div').querySelector('p').style.cursor = null;
})

view.querySelector('div').querySelector('p').addEventListener("mouseenter", (e) => {
    view.querySelector('div').querySelector('p').style.color = "var(--text-hover)";
    view.querySelector('div').querySelector('p').style.cursor = "pointer";
})

view.querySelector('div').querySelector('p').addEventListener("mouseleave", (e) => {
    view.querySelector('div').querySelector('p').style.color = "var(--text)";
    view.querySelector('div').querySelector('p').style.cursor = null;
})
