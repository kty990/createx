import * as heirarcy from './heirarchy.js';
import * as dropdown from './dropdown.js';

const dragdropComponents = []
let displayedProperties = [];
var selectedElement = [];

/* HTML Content Editting & Logic */

const propertyElement = document.getElementById("properties");
const directory = document.getElementById("directory");
const lib = document.getElementById("componentlibrary");
const dragdrop = document.getElementById("drag-drop");
const codeEditor = document.getElementById("editor");

const Plabel = propertyElement.querySelector("#label");

const compType = document.getElementById("comp-type").querySelector("p");
const propertyApply = propertyElement.querySelector("#apply");

const heirarchyWindow = document.getElementById("heirarchy-edit");

// Tabs
const editor = document.getElementById("tabs").querySelector("#editor-tab").querySelector('p'); // v editor
const code = document.getElementById("tabs").querySelector("#code").querySelector('p'); // code editor

class Event {
    callbacks = {};
    constructor() { }
    fire(channel, cont, ...args) {
        if (Array.from(Object.keys(this.callbacks)).indexOf(channel) == -1) {
            this.callbacks[channel] = [];
        }
        this.callbacks[channel].forEach(c => c(...args));
        if (cont) {
            _action.fire(channel, false, ...args);
        }
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
            _action.fire(channel, false);
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
        this.callbacks[channel].splice(this.callbacks.indexOf(cb), 1);
    }
}
const _action = new Event();
const mEvent = new Event();

class Group {
    static group_ids = [];
    static highest_id = 0;
    destroyed = false;
    constructor() {
        let gid = 0;
        if (Group.group_ids.length == 0) {
            gid = 1;
            Group.group_ids.push(gid);
            Group.highest_id = gid;
        } else {
            for (let i = 0; i < Group.highest_id; i++) {
                if (Group.group_ids.indexOf(i) == -1) {
                    gid = i;
                    Group.group_ids.push(gid);
                    break;
                }
            }
            if (gid == 0) {
                gid = ++Group.highest_id;
                Group.group_ids.push(gid);
            }
        }
        this.name = `Group ${gid}`;
        this.id = gid;
        this.components = [];
        this.root = heirarcy.generateRoot(this.name);
        heirarchyWindow.appendChild(this.root.root.element);
    }

    isEmpty() {
        return this.components.length == 0;
    }

    destroy() {
        return new Promise((resolve) => {
            if (this.destroyed) resolve();
            if (this.id == Group.highest_id) {
                let newid = 0;
                for (let i = 0; i < this.id; i++) {
                    if (i < this.id && i > newid) {
                        newid = i;
                    }
                }
                Group.highest_id = newid;
            }
            Group.group_ids.splice(Group.group_ids.indexOf(this.id), 1);
            this.root.root.element.remove();
            this.destroyed = true;
            resolve();
        })
    }

    addComponent(component) {
        this.components.push(component);
        // Update visuals for heirarchy
        component.nestLevel = component.nestLevel || 1;
        this.root.root.addNest(this.root.root, component.nestLevel, component.name, component);
        this.root.root.refresh();
    }

    removeComponent(component) {
        try {
            this.components.splice(this.components.indexOf(component), 1);
            this.root.root.removeNest(component.nestLevel, component)
        } catch (_) { }
    }
}

class Component {
    constructor(name, parent, group = undefined, onSetElement = () => { }) {
        this.name = name;
        this.parent = parent;
        if (group != undefined && group != null) {
            this.group = group;
        }
        this.element = null;
        this.onPropertyChange = (name, value) => {
            console.log(`====== Property Change ======\nName: ${name}\nValue: ${value}\n`);
        };
        this.onSetElement = onSetElement;
        this.properties = {
            color: "#fff",
            background: "#000",
            width: "100px",
            height: "10px",
            left: "100px",
            top: "100px",
            border_radius: "0px",
            border_style: "none",
            border_color: "#fff",
            border_width: "0px",
            display: "block",
            flex_direction: 'row',
            justify_content: "center",
            align_items: "center",
            text_align: "center",

            HOVERcolor: "#fff",
            HOVERbackground: "#000",
            HOVERwidth: "100px",
            HOVERheight: "10px",
            HOVERleft: "100px",
            HOVERtop: "100px",
            HOVERborder_radius: "0px",
            HOVERborder_style: "none",
            HOVERborder_color: "#fff",
            HOVERborder_width: "0px",
            HOVERdisplay: "block",
            HOVERflex_direction: 'row',
            HOVERjustify_content: "center",
            HOVERalign_items: "center",
            HOVERtext_align: "center"


        }
        this.preview = this.properties;
        this.children = [];
        if (this.parent) {
            this.parent.children.push(this);
        }
    }

    setGroup(g) {
        this.group = g;
        this.group.addComponent(this);
    }

    setOnPropertyChange(func) {
        this.onPropertyChange = func;
    }

    setElement(e) {
        console.warn('Setting element:', e);
        this.element = e;
        // this.setProperty('position', 'absolute', null);
        this.setProperty('overflow', 'hidden', null);
        let setting = "";
        for (const [key, value] of Object.entries(this.element.style)) {
            if (this.properties[key]) {
                setting += `${key} = ${value}\nHOVER${key} = ${value}\n\n`;
                this.properties[`${key}`] = value;
                this.properties[`HOVER${key}`] = value;
            }
        }
        console.log('Setting:', setting);
        this.onSetElement(e);
        let properties = this.properties;
        properties.name = this.name;
        window.api.send("createComponent", properties);
        // console.log("Create component", this.name);
        this.element.addEventListener("mouseenter", () => {
            for (const [key, value] of Object.entries(this.properties)) {
                if (['x', 'y', 'left', 'top', 'type'].includes(key)) continue; // This will change when the project is saved/built
                if (key.indexOf("HOVER") == -1) continue;
                this.element.style.setProperty(key, value);
                console.log(`Setting ${key} to ${value}`);
            }
            if (this instanceof ProgressBar) {
                this.setProgress(this.progress);
            }
        })
        this.element.addEventListener("mouseleave", () => {
            for (const [key, value] of Object.entries(this.properties)) {
                if (['x', 'y', 'left', 'top', 'type'].includes(key)) continue; // This will change when the project is saved/built
                if (key.indexOf("HOVER") != -1) continue;
                if (key == 'backgroundColor' || key == 'background_color') {
                    this.element.style.setProperty('background', value);
                    console.log(`Setting background to ${value}`);
                } else {
                    this.element.style.setProperty(key, value);
                    // console.log(`Setting ${key} to ${value}`);
                }
            }
            if (this instanceof ProgressBar) {
                this.setProgress(this.progress);
            }
        })
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

    setProperty(name, value, property) {
        if (name == 'itype') {
            this.element.setAttribute('type', value);
            return;
        }
        if (this.properties) {
            if (!property) {
                this.properties[name] = value;
                if (name.indexOf("HOVER") == -1) {
                    this.element.style.setProperty(name, value);
                }
            } else {
                this.properties[property.indexName] = value;
                if (property.indexName.indexOf("HOVER") == -1) {
                    this.element.style.setProperty(property.indexName, value);
                }
            }
            this.onPropertyChange(name, value, this.element);
            // console.log("Sending properties change: ");
            // console.log(JSON.stringify(this.properties));
            window.api.send("editComponent", this.name, JSON.stringify(this.properties));
        }
    }

    update(properties = null) {
        let p = properties || this.properties;
        window.api.send("editComponent", this.name, JSON.stringify(p));
        for (const [key, value] of Object.entries(p)) {
            this.element.style.setProperty(key.replace("_", "-"), value);
        }
    }

    select(shiftPressed) {
        this.selected = true;
        if (!shiftPressed) {
            selectedElement.forEach(c => c.comp.deselect());
            selectedElement = [];
        }
        console.log('Group:', this.group);
        for (let c of this.group.components) {
            let tmp = { comp: c, element: c.element };
            for (let i = 0; i < selectedElement.length; i++) {
                if (selectedElement[i].comp == tmp.comp) {
                    selectedElement.splice(i, 1);
                }
            }
            selectedElement.push(tmp);
            c.element.style.outlineStyle = 'solid';
            c.element.style.outlineColor = 'var(--selected)';
            c.selected = true;
        }
        mEvent.fire("selectedElementChange", true, selectedElement);

    }

    deselect() {
        this.element.style.outlineStyle = null;
        this.selected = false;
    }
}

class Button extends Component {
    constructor(parent, group = undefined) {
        super("Button", parent, group);
        this.preview.type = 'div';
    }
}

class Text extends Component {
    constructor(parent, group = undefined) {
        super("Text", parent, group);
        this.preview.type = 'p';
    }
}

class Img extends Component {
    constructor(parent, group = undefined) {
        super("Image", parent, group);
        this.preview.type = 'img';
        this.setOnPropertyChange((name, value, element) => {
            console.log(`====== Property Change ======\nName: ${name}\nValue: ${value}\n`);
            if (name == 'src') element.src = value;
            if (name == 'alt') element.alt = value;
        })
    }
}

class Input extends Component {
    constructor(parent, group = undefined) {
        super("Input", parent, group);
        this.preview.type = 'input';
        this.setOnPropertyChange((name, value, element) => {
            console.log(`====== Property Change ======\nName: ${name}\nValue: ${value}\n`);
            if (name == 'value') element.value = value;
            if (name == 'placeholder') element.placeholder = value;
        })
    }
}

// REDONE
class ProgressBar extends Component {
    constructor(parent, group = undefined) {
        super("Progress Bar", parent, group);
        this.background = "#7d7d7d";
        this.preview.type = 'div';
        let p = [];
        for (let i = 0; i < 101; i++) {
            if (i <= 60) {
                p.push("#0f0");
            } else {
                p.push(this.background);
            }
        }
        this.properties.background = `linear-gradient(90deg, ${p.join(",")})`;
        this.progress = 60;
    }
    setProgress(progress) {
        let p = [];
        for (let i = 0; i < 101; i++) {
            if (i <= progress) {
                p.push(this.properties.color || "#0f0");
            } else {
                p.push(this.background);
            }
        }
        this.progress = progress;
        this.properties.background = `linear-gradient(90deg, ${p.join(",")})`;
    }
}

class DropdownMenu extends Component {
    static mains = {};
    static id = 0;

    constructor(parent, dropdownSelections, group = undefined) {
        super("Dropdown Menu", parent, group);
        this.preview.type = 'div';
        this.dropdowns = 0;
        this.selections = dropdownSelections;

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
        let properties = this.properties;
        properties.name = this.name;
        window.api.send("createComponent", properties);
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
            this.setProperty('height', (this.visible) ? 'fit-content' : `${this.properties.height || 10}px`);
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
    static id = 0;
    value = null;
    constructor(name, indexName, itype, allowedComponents, action = () => { }) {
        this.components = allowedComponents;
        this.name = name;
        this.indexName = indexName;
        this.itype = itype;
        if (itype == 'button') {
            this.action = action;
        }
        this.id = ++Property.id;
    }
    isAllowed(componentName) {
        console.log(componentName, this.name);
        return this.components.includes(componentName) || this.components.includes("*");
    }
    createElement() {
        let lbl = null;
        if (this.itype == 'file') {
            lbl = document.createElement("label");
            lbl.setAttribute('for', `${this.id}`);
            lbl.textContent = `Select`;
        }
        let tmp = document.createElement("div");
        tmp.classList.add('property');
        let name = document.createElement("p");
        name.textContent = this.name;
        tmp.appendChild(name);
        let input = document.createElement("input");
        input.type = this.itype;
        if (this.itype == 'file') {
            input.id = `${this.id}`;
        }
        if (this.action) {
            input.addEventListener("click", this.action);
        }
        if (lbl != null) {
            tmp.appendChild(lbl);
        }
        tmp.appendChild(input);
        this.element = tmp;
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
    activate() { }
}

class Enum extends Property {
    constructor(name, options = [], allowedComponents = [], enumSelected = (element, name, inputElement) => { }) {
        super(name, 'enum', 'ENUM', allowedComponents);
        this.options = options;
        this.height = 10;
        this.onEnumSelected = enumSelected;
        this.value = options[0] || null;
    }

    createElement() {
        // Do this
        let tmp = document.createElement("div");
        tmp.classList.add("enum");
        let p = document.createElement("p");
        p.textContent = this.name;
        tmp.appendChild(p);
        let dd = document.createElement("div");
        dd.style.display = 'none';
        dd.style.flexDirection = 'column';
        for (let o of this.options) {
            let op = document.createElement("p");
            op.textContent = o;
            dd.appendChild(op);
            op.addEventListener("click", () => {
                this.onEnumSelected(op, o, this.element);
                this.value = o;
                p.textContent = `Input Type\n(${o.toUpperCase()})`;
                // dd.style.display = 'none';
                // this.visible = 'hidden';
                console.log(`${o} selected in enum. Hiding dropdown`);
            })
        }
        tmp.addEventListener("click", () => {
            // Show dropdown
            if (this.visible == undefined) {
                this.visible = 'visible';
            } else {
                this.visible = (this.visible == 'visible') ? 'hidden' : 'visible';
            }
            this.element.querySelector("div").style.display = (this.visible == 'visible') ? 'flex' : 'none';
            this.element.style.height = (this.visible) ? 'fit-content' : `${this.height || 10}px`;
            console.log(this.visible);
        })
        tmp.appendChild(dd);
        this.element = tmp;
        return this.element;
    }

    setOnEnumSelected(func) {
        this.onEnumSelected = func;
    }
}

const registry = {
    'Button': Button,
    'Text': Text,
    'ProgressBar': ProgressBar,
    'DropdownMenu': DropdownMenu,
    'Img': Img,
    'Input': Input
}

const properties = {
    'name': new Property('Name', 'name', 'text', ['*']),
    'color': new Property('Color', 'color', 'color', ['*']),
    'background_color': new Property("Background", 'background', 'color', ['*']),
    'textContent': new Property('Text', 'textContent', 'text', ['Text']),
    'x': new Property('X', 'left', 'number', ['*']),
    'y': new Property('Y', 'top', 'number', ['*']),
    'width': new Property('Width', 'width', 'number', ['*']),
    'height': new Property('Height', 'height', 'number', ['*']),
    'progress': new Property('Progress', 'progress', 'number', ['ProgressBar']),
    'addDropdown': new Property('Add Option', 'addDropdown', 'button', ['DropdownMenu'], (event) => {
        const component = selectedElement[0].comp;
        component.addDropdown();
    }),
    'removeDropdown': new Property('Remove Option', 'removeDropdown', 'button', ['DropdownMenu'], (event) => {
        const component = selectedElement[0].comp;
        component.removeDropdown();
    }),
    'src_file': new Property("File", 'src', 'file', ['Img']),
    'src_text': new Property("URL", 'src', 'text', ['Img']),
    'alt': new Property("Alt Text", 'alt', 'text', ['Img']),
    'itype': new Enum('Input Type', 'itype', ["text", "password", "email", "url", "tel", "number", "date", "time", "month", "week", "submit", "reset", "button", "color", "range", "checkbox", "radio", "file"], ['Input']),
    'hover_color': new Property('Hover Color', 'HOVERcolor', 'color', ['*']),
    'hover_bgcolor': new Property('Hover Background', 'HOVERbackground', 'color', ['*']),
    'hover_x': new Property('Hover X', 'HOVERleft', 'number', ['*']),
    'hover_y': new Property('Hover Y', 'HOVERtop', 'number', ['*']),
    'hover_width': new Property('Hover Width', 'HOVERwidth', 'number', ['*']),
    'hover_height': new Property('Hover Height', 'HOVERheight', 'number', ['*']),
}

function removeAll() {
    directory.innerHTML = "";
    compType.textContent = "-";
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
    new Button(null, 'null'),
    new Text(null, 'null'),
    new ProgressBar(null, 'null'),
    new DropdownMenu(null, null, 'null'),
    new Img(null, 'null'),
    new Input(null, 'null')
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
            e.style.setProperty(key.replace("_", "-"), value);
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
            tmp.style.width = c.properties.width;
            tmp.style.height = c.properties.height;
            tmp.style.zIndex = null;
            c.setElement(tmp);
            c.setGroup(new Group());
            if (c instanceof DropdownMenu) {
                c.activate();
                console.warn("Activated");
            }

            tmp.addEventListener("click", (e) => {
                removeAll();
                if (e.shiftKey) {
                    if (selectedElement.indexOf({ comp: c, element: tmp }) != -1) return;
                    selectedElement.push({ comp: c, element: tmp })
                    c.select(true);
                    return;
                }
                if (selectedElement.length != 0) selectedElement.forEach(d => d.comp.deselect());
                selectedElement = [{ comp: c, element: tmp }];
                c.select(false);
                displayedProperties = [];
                for (const [name, p] of Object.entries(properties)) {
                    if (p.isAllowed(getTypeOf(c))) {
                        let property = p.createElement();
                        p.activate();
                        displayedProperties.push({ name: name, element: tmp, type: p.constructor.name.toLowerCase(), property: p });
                        switch (name) {
                            case 'name':
                                property.querySelector("input").placeholder = c.name;
                                break;
                            case 'color':
                                let values = c.element.style.color.replace("rgb", '').replace('(', '').replace(")", '').split(",");
                                let hex = rgbToHex(values[0], values[1], values[2]);
                                property.querySelector("input").value = hex;
                                break;
                            case 'backgroundColor':
                                property.querySelector("input").value = c.properties.backgroundColor || c.element.style.background || "#f00";
                                break;
                            case 'textContent':
                                property.querySelector('input').placeholder = c.element.textContent;
                                break;
                            case 'x':
                                property.querySelector("input").placeholder = parseInt(c.properties.left.replace('px', ''));
                                break;
                            case 'y':
                                property.querySelector("input").placeholder = parseInt(c.properties.top.replace('px', ''));
                                break;
                            case 'width':
                                property.querySelector("input").placeholder = parseInt(c.properties.width.replace('px', ''));
                                break;
                            case 'height':
                                property.querySelector("input").placeholder = parseInt(c.properties.height.replace('px', ''));
                            case 'progress':
                                property.querySelector("input").placeholder = selectedElement[0].comp.progress;
                                break;
                            case 'src_file':
                                property.querySelector("input").placeholder = selectedElement[0].comp.properties.src || "src";
                            case 'src_text':
                                property.querySelector("input").placeholder = selectedElement[0].comp.properties.src || "src";;

                        }
                        if (selectedElement[0].comp instanceof ProgressBar && (name == 'background_color')) {
                            console.log("YES");
                            property.querySelector("input").value = selectedElement[0].comp.background;
                        }
                        directory.appendChild(property);
                    }
                }
                console.log(displayedProperties);
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
                if (c.selected) return;
                tmp.style.outline = "solid";
                tmp.style.outlineColor = "var(--body)";
            })

            tmp.addEventListener("mouseleave", () => {
                if (c.selected) return;
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
        // console.log(selectedElement[0].comp);
        // console.log(displayedProperties.map(c => c.element));
        const c = selectedElement[0].comp;
        for (let p of displayedProperties) {
            if (!p.property instanceof Property) continue;
            if (p.type == 'property') {
                console.log(p);
                let v = p.property.element.querySelector("input").value;
                // console.log(v);
                if (`${v}`.length == 0 || v == null || v == undefined) {
                    console.log("Continue", p.name, `${v}`, p.property.element);
                    continue;
                }
                c.setProperty(p.name, v, p.property);
                if (p.name == "textContent") {
                    selectedElement[0].element.textContent = v;
                    console.warn(`Setting ${p.name} to ${v}`);
                } else if (p.name == 'x') {
                    selectedElement[0].element.style.left = `${v}px`;
                    console.warn(`Setting ${p.name} to ${v}`);
                } else if (p.name == 'y') {
                    console.warn(`Setting ${p.name} to ${v}`);
                    selectedElement[0].element.style.top = `${v}px`;
                } else if (p.name == 'progress') {
                    selectedElement[0].comp.setProgress(v);
                } else {
                    console.warn(`Setting ${p.name} to ${v}`);
                    if (selectedElement[0].comp instanceof ProgressBar && p.name == 'background_color') {
                        // console.log("YES");
                        selectedElement[0].comp.background = v;
                        selectedElement[0].comp.setProgress(selectedElement[0].comp.progress);
                    } else {
                        selectedElement[0].element.style.setProperty(p.name, `${v}${(p.name == 'width' || p.name == 'height') ? 'px' : ''}`);
                    }
                }
                switch (p.name) {
                    case 'name':
                        selectedElement[0].comp.name = p.element.value;
                        p.element.placeholder = selectedElement[0].comp.name;
                        break;
                    case 'color':
                        let values = c.element.style.color.replace("rgb", '').replace('(', '').replace(")", '').split(",");
                        let hex = rgbToHex(values[0], values[1], values[2]);
                        p.element.value = hex;
                        // console.log(hex);
                        break;
                    case 'backgroundColor':
                        p.element.value = c.element.style.backgroundColor;
                        break;
                    case 'textContent':
                        p.element.placeholder = c.element.textContent;
                        break;
                    case 'x':
                        p.element.placeholder = parseInt(c.element.style.left.replace('px', ''));
                        break;
                    case 'y':
                        p.element.placeholder = parseInt(c.element.style.top.replace('px', '')) || c.position.x;
                        break;
                    case 'width':
                        p.element.placeholder = parseInt(c.element.style.width.replace('px', '')) || c.size.width;
                        break;
                    case 'height':
                        p.element.placeholder = parseInt(c.element.style.height.replace('px', '')) || c.size.height;

                }
                if (p.element.type != "color") {
                    p.element.value = null;
                }
            } else {
                // ENUM LOGIC HERE
                if (p.name == 'itype') {
                    p.element.setAttribute('type', p.property.value);
                }
            }
        }

    }
})

dragdrop.addEventListener("click", (e) => {
    if (e.target != dragdrop) return;
    if (selectedElement.length > 0) {
        selectedElement.forEach(d => d.comp.deselect());
        selectedElement = [];
        removeAll();
        mEvent.fire("selectedElementChange", true, selectedElement);
    }
})

mEvent.receive('selectedElementChange', () => {
    console.log('Selected:', selectedElement);
    if (selectedElement.length > 1) {
        // Allow grouping and ungrouping
        document.getElementById("group").classList.remove("disabled");
        document.getElementById("ungroup").classList.remove("disabled");
    } else {
        let cl = Array.from(document.getElementById("group").classList);
        if (cl.includes('disabled')) return;
        document.getElementById("group").classList.add("disabled");
        document.getElementById("ungroup").classList.add("disabled");
    }
})






window.api.on("group", async () => {
    console.log('SelectedElement:', selectedElement);
    if (selectedElement.length <= 1) return;
    for (let e of selectedElement) {
        if (e.comp.group) {
            e.comp.group.removeComponent(e.comp);
            if (e.comp.group.isEmpty()) {
                await e.comp.group.destroy();
            }
        }
    }
    let g = new Group();
    for (let e of selectedElement) {
        e.comp.setGroup(g);
    }
})


// Fix the group numbering when ungrouping : TODO
window.api.on("ungroup", () => {
    if (selectedElement.length <= 1) return;
    for (let e of selectedElement) {
        if (e.comp.group) {
            e.comp.group.removeComponent(e.comp);
        }
        e.comp.group.destroy()
        e.comp.setGroup(new Group());
    }
}) 