class Component {
    constructor(name, parent, group = null) {
        this.name = name;
        this.parent = parent;
        this.group = group;
        this.element = null;
        this.size = {
            width: '100px',
            height: '100px'
        };
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
    constructor(parent, dropdownSelections, group) {
        super("Dropdown Menu", parent, group);
        this.selections = dropdownSelections;
    }

    activate() {
        if (!this.element) {
            throw new Error("Unable to activate without element generation. Call createElement() first.")
        }
        this.element.addEventListener("click", () => {
            // Show dropdown
        })
    }
}

class Property {
    constructor(name, itype, ...allowedComponents) {
        this.components = allowedComponents;
        this.name = name;
        this.inputType = itype;
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

const properties = {
    'name': new Property('Name', 'text', '*'),
    'color': new Property('Foreground Color', 'color', '*'),
    'background_color': new Property("Background Color", 'color', '*'),
    'textContent': new Property('Text', 'text', 'Text'),
    'x': new Property('X', 'number', '*'),
    'y': new Property('Y', 'number', '*'),
    'width': new Property('Width', 'number', '*'),
    'height': new Property('Height', 'number', '*'),
    'progress': new Property('Progress', 'number', 'Progress Bar')
}

const dragdropComponents = []
let displayedProperties = [];

/* HTML Content Editting & Logic */

var selectedElement = null;

const propertyElement = document.getElementById("properties");
const lib = document.getElementById("componentlibrary");
const dragdrop = document.getElementById("drag-drop");

const propertyApply = propertyElement.querySelector("#apply");

const library = [
    new Button(null, null),
    new Text(null, null),
    new ProgressBar(null, null)
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
            c.setElement(tmp);

            tmp.addEventListener("click", () => {
                selectedElement = { comp: c, element: tmp };
                for (let p of Array.from(propertyElement.children)) {
                    if (p.id != "label" && p.id != 'apply') {
                        p.remove();
                    }
                }
                displayedProperties = [];
                for (const [name, p] of Object.entries(properties)) {
                    if (p.isAllowed(c.name)) {
                        let tmp = p.createElement();
                        displayedProperties.push({ name: name, element: tmp });
                        switch (name) {
                            case 'name':
                                tmp.querySelector("input").placeholder = c.name;
                                break;
                            case 'color':
                                tmp.querySelector("input").value = c.element.style.color;
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
                        propertyElement.insertBefore(tmp, propertyApply);
                    }
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

    // MODIFY THIS:: CHECK IF THE INPUT FIELD IS EMPTY. IF IT IS, DO NOT CHANGE
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
                    p.element.querySelector("input").placeholder = c.name;
                    break;
                case 'color':
                    p.element.querySelector("input").placeholder = c.element.style.color;
                    break;
                case 'backgroundColor':
                    p.element.querySelector("input").placeholder = c.element.style.backgroundColor;
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
        }

    }
})
// Load elements from save

