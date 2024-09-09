var root_count = 0;

/**
 * Needs to be modified.
 * refresh method needs to properly display the parent-child relationship
 *    -> Currently just sorts by nest level
 */
class hRoot {
    constructor(id, element, displayValue = "") {
        this.id = id;
        this.element = element;
        this.nests = {}
        this.nestLevels = [];
        this.displayValue = displayValue;
    }

    addNest(nestLevel, displayValue) {
        let nest = document.createElement("div");
        nest.classList.add("h-nest");
        nest.id = `${nestLevel}`;
        nest.innerHTML = `<span id='indent' style='margin-left: ${((nestLevel - 1) * 10) + 5}px;margin-right: 5px;'>⇁</span>${displayValue}`;
        this.element.appendChild(nest);
        if (this.nests[`${nestLevel}`] != undefined && this.nests[`${nestLevel}`] != null) {
            this.nests[`${nestLevel}`].push(nest);
        } else {
            this.nests[`${nestLevel}`] = [];
            this.nests[`${nestLevel}`].push(nest);
            this.nestLevels.push(`${nestLevel}`);
        }
        return { id: nestLevel, nest } // replace when logic implemented
    }

    refresh() {
        this.element.innerHTML = `${this.displayValue}`;
        for (let level of this.nestLevels) {
            for (let e of this.nests[level]) {
                this.element.appendChild(e);
            }
        }
    }
}

function generateRoot(displayValue) {
    let r = document.createElement("div");
    r.id = `${++root_count}`;
    r.classList.add("h-root");
    r.textContent = `${displayValue}`;
    return { id: parseInt(r.id), root: new hRoot(parseInt(r.id), r, displayValue) } // replace when logic implemented
}

export { root_count, generateRoot }