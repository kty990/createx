var root_count = 0;

class hNest {
    /**
     * @param {hNest | hRoot} parent
     * @param {number} nestLevel
     * @param {String} id
     * @param {String} displayValue
     */
    constructor(parent, nestLevel, id, displayValue, component) {
        displayValue = `<span id='indent' style='margin-left: ${((nestLevel - 1) * 10) + 5}px;margin-right: 5px;'>⇁</span>${displayValue}`
        this.parent = parent;
        this.component = component;
        this.id = id;
        this.displayValue = displayValue;
        let nest = document.createElement("div");
        nest.classList.add("h-nest");
        nest.id = `${nestLevel}`;
        nest.innerHTML = displayValue;
        this.element = nest;
    }
}

class hRoot {
    /**
     * @param {String} id
     * @param {HTMLElement} element
     * @param {String | null} displayvalue
     */
    constructor(id, element, displayValue = "") {
        this.id = id;
        this.element = element;
        this.nests = {}
        this.nestLevels = [];
        this.displayValue = displayValue;
    }

    addNest(p, nestLevel, displayValue, component) {
        console.warn('Adding nest:', nestLevel, component);
        let parent = p;
        if (p.nest) {
            parent = p.nest;
        }
        let n = new hNest(parent, nestLevel, `${nestLevel}`, displayValue, component);
        if (this.nests[`${nestLevel}`] != undefined && this.nests[`${nestLevel}`] != null) {
            this.nests[`${nestLevel}`].push(n);
        } else {
            this.nests[`${nestLevel}`] = [];
            this.nests[`${nestLevel}`].push(n);
            this.nestLevels.push(`${nestLevel}`);
        }
        return { id: nestLevel, nest: n } // replace when logic implemented
    }

    removeNest(nestLevel, component) {
        console.warn('Removing nest:', nestLevel, component);
        try {
            for (let i = 0; i < this.nests[`${nestLevel}`]; i++) {
                if (this.nests[`${nestLevel}`][i].component == component) {
                    this.nests[`${nestLevel}`].splice(i, 1);
                }
            }
        } catch (e) { }
    }

    refresh() { // parent element = parent.element
        this.element.innerHTML = `${this.displayValue}`;
        for (let level of this.nestLevels) {
            console.log(this.nests[level]);
            for (let e of this.nests[level]) {
                console.log('Removing:', e);
                e.element.remove();
            }
            for (let e of this.nests[level]) {
                let ch = Array.from(e.parent.element.children);
                if (ch.indexOf(e.element) != -1) continue;
                e.parent.element.appendChild(e.element);
            }
        }
    }
}

/**
 * 
 * @param {String} displayValue 
 * @returns {{id:number,root:hRoot}}
 */
function generateRoot(displayValue) {
    let r = document.createElement("div");
    r.id = `${++root_count}`;
    r.classList.add("h-root");
    r.textContent = `${displayValue}`;
    return { id: parseInt(r.id), root: new hRoot(parseInt(r.id), r, displayValue) } // replace when logic implemented
}

export { root_count, generateRoot }

/**
 * EXAMPLE:
 * 
let { id, root } = heirarcy.generateRoot('Test');
heirarchyWindow.appendChild(root.element);
let n1 = root.addNest(root, 1, '1');
let n2 = root.addNest(n1.nest, 2, '2');
let n3 = root.addNest(n1.nest, 3, '3');
let n4 = root.addNest(n2.nest, 1, '1');
let n5 = root.addNest(n2.nest, 1, '1');
let n6 = root.addNest(n2.nest, 2, '2');
heirarchyWindow.appendChild(root.element.cloneNode(true));

root.refresh();
 */