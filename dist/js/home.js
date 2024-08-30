class Component {
    constructor(name, parent, group = null, onSetElement = () => { }) {
        this.name = name;
        this.parent = parent;
        this.group = group;
        this.element = null;
        this.size = {
            width: '100px',
            height: '100px'
        };
        this.onSetElement = onSetElement;
        this.position = {
            x: '0px',
            y: '0px'
        };
        this.children = [];
        if (this.parent) {
            this.parent.children.push(this);
        }
    }

    setElement(e) {
        this.element = e;
        this.element.style.overflow = 'hidden';
        console.log(e);
        this.onSetElement(e);
        let properties = this.properties;
        properties.name = this.name;
        window.api.send("createComponent", properties);
    }

    copy() {
        let t = this.constructor.name;
        let tmp = new registry[t];
        for (const [key, value] of Object.entries(this)) {
            tmp[key] = value;
        }
        return tmp;
    }

    createElement(callback) {
        let e = document.createElement("div");
        e.style.width = this.size.width + "px";
        e.style.height = this.size.height + "px";
        e.addEventListener("click", callback);
        this.element = e;
        return e;
    }

    setProperty(name, value) {
        if (this.properties) {
            this.properties[name] = value;
            console.log("Sending properties change: ");
            console.log(JSON.stringify(this.properties));
            window.api.send("editComponent", this.name, JSON.stringify(this.properties));
        }
    }
}

class Button extends Component {
    constructor(parent, group) {
        super("Button", parent, group);
        this.preview = {
            type: 'div',
            width: '100px',
            height: "100px",
            border_radius: '10px',
            background_color: 'var(--body)',
        }
        this.properties = this.preview;
    }
}

class Text extends Component {
    constructor(parent, group) {
        super("Text", parent, group);
        this.preview = {
            type: 'p',
            text_content: 'Text Here',
            width: '100px',
            height: "100px",
            left: "12.5%",
            top: "30%",
            color: 'var(--text-hover)',
            text_content: 'TEXT HERE',
            text_shadow: '#000 1px 5px 10px'
        }
        this.properties = this.preview;
    }
}

class ProgressBar extends Component {
    constructor(parent, group) {
        super("Progress Bar", parent, group);
        this.background = "#7d7d7d"
        this.preview = {
            type: 'div',
            width: '100px',
            height: "10px",
            border_radius: '1px',
            background: `linear-gradient(90deg,${this.background},${this.background})`,
        }
        this.properties = this.preview;
        let p = [];
        for (let i = 0; i < 101; i++) {
            if (i <= 60) {
                p.push("#0f0");
            } else {
                p.push(this.background);
            }
        }
        this.preview.background = `linear-gradient(90deg, ${p.join(",")})`;
        this.progress = 60;
    }
    setProgress(progress) {
        let p = [];
        for (let i = 0; i < 101; i++) {
            if (i <= progress) {
                p.push(this.element.style.color || "#0f0");
            } else {
                p.push(this.background);
            }
        }
        this.progress = progress;
        this.element.style.background = `linear-gradient(90deg, ${p.join(",")})`;
    }
}

class DropdownMenu extends Component {
    static mains = {};
    static id = 0;

    constructor(parent, dropdownSelections, group) {
        super("Dropdown Menu", parent, group);
        this.dropdowns = 0;
        this.selections = dropdownSelections;
        this.preview = {
            type: 'p',
            text_content: 'TITLE',
            width: '100px',
            height: "10px",
            text_align: 'center',
            border_radius: '1px',
            background_color: 'var(--interaction)',
            border_color: 'var(--interaction)',
            border_style: 'solid',
            border_width: '1px'
        }
        this.properties = this.preview;
    }

    setElement(element) {
        this.element = element;
        let tmp = document.createElement('div');
        tmp.style.display = 'flex';
        tmp.style.flexDirection = 'column';
        tmp.style.width = 'fit-content';
        tmp.style.maxWidth = '100%';
        tmp.style.position = 'absolute';
        tmp.style.top = '100%';
        tmp.style.left = '0';
        tmp.style.visibility = 'hidden';
        this.main = tmp;
        this.element.appendChild(this.main);
        console.log(this.main);
        console.log("this.main @super^")

        return this.element;
    }

    activate() {
        if (!this.element) {
            throw new Error("Unable to activate without element generation. Call createElement() first.")
        }
        this.element.addEventListener("click", () => {
            // Show dropdown
            if (this.visible == undefined) {
                this.visible = 'visible';
            } else {
                this.visible = (this.visible == 'visible') ? 'hidden' : 'visible';
            }
            this.element.querySelector("div").style.visibility = this.visible;
            this.element.style.height = (this.visible) ? 'fit-content' : `${this.properties.height || 10}px`;
        })
    }

    addDropdown() {
        console.log(this.main);
        console.log('this.main^');
        let e = document.createElement("input");
        e.type = 'text';
        e.value = `Dropdown ${++this.dropdowns}`;
        e.id = `Dropdown ${this.dropdowns}`;
        e.style.backgroundColor = 'var(--interaction)';
        e.style.borderColor = 'var(--interaction-border)';
        e.style.borderStyle = 'solid';
        e.style.borderWidth = '1px';
        this.main.appendChild(e);
    }

    removeDropdown() {
        let element = document.getElementById(`Dropdown ${this.dropdowns--}`);
        element.remove();
    }
}

class Property {
    constructor(name, itype, allowedComponents, action = () => { }) {
        this.components = allowedComponents;
        this.name = name;
        this.inputType = itype;
        if (itype == 'button') {
            this.action = action;
        }
    }
    isAllowed(componentName) {
        return this.components.includes(componentName) || this.components.includes("*");
    }
    createElement() {
        let tmp = document.createElement("div");
        tmp.classList.add('property');
        let name = document.createElement("p");
        name.textContent = this.name;
        tmp.appendChild(name);
        let input = document.createElement("input");
        input.type = this.inputType;
        if (this.action) {
            input.addEventListener("click", this.action);
        }
        tmp.appendChild(input);
        return tmp;
    }
    static getApplied(componentName) {
        let values = [];
        let keys = [];
        for (const [name, p] of Object.entries(properties)) {
            if (p.isAllowed(componentName)) {
                keys.push(name.replace("_", "-"))
                values.push(p);
            }
        }
        console.log(keys, values);
        return { keys, values };
    }
}

const registry = {
    'Button': Button,
    'Text': Text,
    'ProgressBar': ProgressBar,
    'DropdownMenu': DropdownMenu
}

var selectedElement = null;

const properties = {
    'name': new Property('Name', 'text', ['*']),
    'color': new Property('Foreground Color', 'color', ['*']),
    'background_color': new Property("Background Color", 'color', ['*']),
    'textContent': new Property('Text', 'text', ['Text']),
    'x': new Property('X', 'number', ['*']),
    'y': new Property('Y', 'number', ['*']),
    'width': new Property('Width', 'number', ['*']),
    'height': new Property('Height', 'number', ['*']),
    'progress': new Property('Progress', 'number', ['ProgressBar']),
    'addDropdown': new Property('Add Option', 'button', ['DropdownMenu'], (event) => {
        const component = selectedElement.comp;
        component.addDropdown();
    }),
    'removeDropdown': new Property('Remove Option', 'button', ['DropdownMenu'], (event) => {
        const component = selectedElement.comp;
        component.removeDropdown();
    })
}

const dragdropComponents = []
let displayedProperties = [];

/* HTML Content Editting & Logic */

const propertyElement = document.getElementById("properties");
const directory = document.getElementById("directory");
const lib = document.getElementById("componentlibrary");
const dragdrop = document.getElementById("drag-drop");
const codeEditor = document.getElementById("editor");

const Plabel = propertyElement.querySelector("#label");

const compType = document.getElementById("comp-type").querySelector("p");
const propertyApply = propertyElement.querySelector("#apply");

// Tabs
const editor = document.getElementById("tabs").querySelector("#editor-tab").querySelector('p'); // v editor
const code = document.getElementById("tabs").querySelector("#code").querySelector('p'); // code editor

function removeAll() {
    directory.innerHTML = "";
}

editor.addEventListener("click", () => {
    removeAll();
    dragdrop.style.zIndex = '2';
    codeEditor.style.zIndex = '1';
    propertyApply.querySelector("p").textContent = "Apply"
    Plabel.querySelector("p").textContent = "Properties";
    document.getElementById("comp-type").style.visibility = 'visible';
})

code.addEventListener("click", () => {
    removeAll();
    dragdrop.style.zIndex = '1';
    codeEditor.style.zIndex = '2';
    propertyApply.querySelector("p").textContent = "Add New"
    Plabel.querySelector("p").textContent = "Directory";
    document.getElementById("comp-type").style.visibility = 'hidden';
})

function getTypeOf(comp) {
    return comp.constructor.name;
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

const library = [
    new Button(null, null),
    new Text(null, null),
    new ProgressBar(null, null),
    new DropdownMenu(null, null, null)
]



for (let component of library) {
    let preview = component.preview;
    let comp = document.createElement("div");
    comp.classList.add('component');
    let e = document.createElement(preview.type);

    for (const [key, value] of Object.entries(preview)) {
        if (key == 'height' || key == 'width') {
            e.style.height = '15px';
            e.style.width = (Array.from(Object.keys(preview)).includes('text_content')) ? 'auto' : '15px';
        } else if (key != 'type' && key != 'text_content') {
            e.style[key.replace("_", "-")] = value;
        } else if (key == 'text_content') {
            e.textContent = value;
        }
    }
    let tmp = document.createElement("p");
    tmp.style.visibility = 'hidden';
    e.appendChild(tmp);
    let p = document.createElement("p");
    p.textContent = component.name;
    comp.appendChild(p);
    comp.appendChild(e);
    lib.appendChild(comp);

    let previewElement;
    let isDown = false;
    let isDragging = false;
    let rect;
    let w;
    let h;
    const padding = 10;

    function onDrag(e) {
        if (!rect) {
            rect = previewElement.getBoundingClientRect();
            w = rect.width / 2
            h = rect.height;
        }
        isDragging = true;
        // Get position of mouse
        const mouseX = e.clientX;
        const mouseY = e.clientY;



        // While dragging, move 'preview' to mouse position
        previewElement.style.left = `${mouseX + w}px`;
        previewElement.style.top = `${mouseY - (h + padding)}px`;
    }

    function onDown(ev) {
        console.log("Down");
        isDown = true;
        previewElement = e.cloneNode(true);
        previewElement.style.position = 'fixed';
        previewElement.style.zIndex = '999999';
        document.body.addEventListener("mousemove", onDrag);
        previewElement.style.visibility = 'visible';
        document.body.appendChild(previewElement);
    }

    comp.addEventListener("mousedown", onDown);

    document.body.addEventListener("mouseup", (e) => {
        console.log("Up");
        if (!isDown) return;
        isDragging = false;
        isDown = false;
        document.body.removeEventListener("mousemove", onDrag);

        if (e.target == dragdrop) {
            // If mouse release over drag/drop area, add new component of this type to drag/drop area with appropriate properties

            // Get position relative to dragdrop
            const rect = dragdrop.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Place at position
            let tmp = previewElement.cloneNode(true);
            tmp.style.left = x;
            tmp.style.top = y;
            // tmp.style.position = 'relative';

            let c = component.copy();

            // Set size
            tmp.style.width = c.size.width;
            tmp.style.height = c.size.height;
            tmp.style.zIndex = null;
            c.setElement(tmp);
            if (c instanceof DropdownMenu) {
                c.activate();
                console.warn("Activated");
            }

            tmp.addEventListener("click", () => {
                removeAll();
                selectedElement = { comp: c, element: tmp };
                displayedProperties = [];
                for (const [name, p] of Object.entries(properties)) {
                    if (p.isAllowed(getTypeOf(c))) {
                        let tmp = p.createElement();
                        displayedProperties.push({ name: name, element: tmp });
                        switch (name) {
                            case 'name':
                                tmp.querySelector("input").placeholder = c.name;
                                break;
                            case 'color':
                                let values = c.element.style.color.replace("rgb", '').replace('(', '').replace(")", '').split(",");
                                let hex = rgbToHex(values[0], values[1], values[2]);
                                tmp.querySelector("input").value = hex;
                                break;
                            case 'backgroundColor':
                                tmp.querySelector("input").value = c.element.style.backgroundColor || c.element.style.background || "#f00";
                                break;
                            case 'textContent':
                                tmp.querySelector('input').placeholder = c.element.textContent;
                                break;
                            case 'x':
                                tmp.querySelector("input").placeholder = parseInt(c.element.style.left.replace('px', ''));
                                break;
                            case 'y':
                                tmp.querySelector("input").placeholder = parseInt(c.element.style.top.replace('px', ''));
                                break;
                            case 'width':
                                tmp.querySelector("input").placeholder = parseInt(c.element.style.width.replace('px', ''));
                                break;
                            case 'height':
                                tmp.querySelector("input").placeholder = parseInt(c.element.style.height.replace('px', ''));
                            case 'progress':
                                tmp.querySelector("input").placeholder = selectedElement.comp.progress;

                        }
                        if (selectedElement.comp instanceof ProgressBar && (name == 'background_color')) {
                            console.log("YES");
                            tmp.querySelector("input").value = selectedElement.comp.background;
                        }
                        directory.appendChild(tmp);
                    }
                }
                compType.textContent = `${getTypeOf(c)}`;
            })

            let down = false;
            let offset = {
                x: 0,
                y: 0
            }

            document.addEventListener("mousedown", (e) => {
                // Set up for dragging
                if (e.target != tmp) return;
                down = true;
                offset.x = Math.abs(parseInt(`${tmp.style.left}`.replace('px', '')) - e.clientX);
                offset.y = Math.abs(parseInt(`${tmp.style.top}`.replace('px', '')) - e.clientY);
            })

            document.addEventListener("mouseup", (e) => {
                if (!down) {
                    return;
                }
                down = false;
                let rect = dragdrop.getBoundingClientRect();
                const x = e.clientX - offset.x
                const y = e.clientY - offset.y;
                tmp.style.left = `${x}px`;
                tmp.style.top = `${y}px`;
                console.log(`Down changed to: ${down}`)
            })

            document.addEventListener("mousemove", (e) => {
                if (down) {
                    console.log('Moving');
                    const x = e.clientX - offset.x
                    const y = e.clientY - offset.y;
                    tmp.style.left = `${x}px`;
                    tmp.style.top = `${y}px`;
                }
            })

            tmp.addEventListener("mouseenter", () => {
                tmp.style.outline = "solid";
                tmp.style.outlineColor = "var(--body)";
            })

            tmp.addEventListener("mouseleave", () => {
                tmp.style.outline = 'unset';
            })



            dragdropComponents.push(c);
            dragdrop.appendChild(tmp);
        }
        previewElement.remove();
    })
}

propertyApply.addEventListener("click", () => {
    if (dragdrop.style.zIndex != '2') return;
    if (selectedElement) {
        console.log(selectedElement.comp);
        console.log(displayedProperties.map(c => c.element));
        const c = selectedElement.comp;
        for (let p of displayedProperties) {
            let v = p.element.querySelector("input").value;
            console.log(v);
            if (`${v}`.length == 0 || v == null || v == undefined) {
                console.log("Continue");
                continue;
            }
            c.setProperty(p.name, v);
            if (p.name == "textContent") {
                selectedElement.element.textContent = v;
                console.warn(`Setting ${p.name} to ${v}`);
            } else if (p.name == 'x') {
                selectedElement.element.style.left = `${v}px`;
                console.warn(`Setting ${p.name} to ${v}`);
            } else if (p.name == 'y') {
                console.warn(`Setting ${p.name} to ${v}`);
                selectedElement.element.style.top = `${v}px`;
            } else if (p.name == 'progress') {
                selectedElement.comp.setProgress(v);
            } else {
                console.warn(`Setting ${p.name} to ${v}`);
                if (selectedElement.comp instanceof ProgressBar && p.name == 'background_color') {
                    console.log("YES");
                    selectedElement.comp.background = v;
                    selectedElement.comp.setProgress(selectedElement.comp.progress);
                } else {
                    selectedElement.element.style[p.name] = `${v}${(p.name == 'width' || p.name == 'height') ? 'px' : ''}`;
                }
            }
            switch (p.name) {
                case 'name':
                    selectedElement.comp.name = p.element.querySelector("input").value;
                    p.element.querySelector("input").placeholder = selectedElement.comp.name;
                    break;
                case 'color':
                    let values = c.element.style.color.replace("rgb", '').replace('(', '').replace(")", '').split(",");
                    let hex = rgbToHex(values[0], values[1], values[2]);
                    p.element.querySelector("input").value = hex;
                    console.log(hex);
                    break;
                case 'backgroundColor':
                    p.element.querySelector("input").value = c.element.style.backgroundColor;
                    break;
                case 'textContent':
                    p.element.querySelector('input').placeholder = c.element.textContent;
                    break;
                case 'x':
                    p.element.querySelector("input").placeholder = parseInt(c.element.style.left.replace('px', ''));
                    break;
                case 'y':
                    p.element.querySelector("input").placeholder = parseInt(c.element.style.top.replace('px', '')) || c.position.x;
                    break;
                case 'width':
                    p.element.querySelector("input").placeholder = parseInt(c.element.style.width.replace('px', '')) || c.size.width;
                    break;
                case 'height':
                    p.element.querySelector("input").placeholder = parseInt(c.element.style.height.replace('px', '')) || c.size.height;

            }
            if (p.element.querySelector("input").type != "color") {
                p.element.querySelector("input").value = null;
            }
        }

    }
})