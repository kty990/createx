class Notification {
    /**
     * 
     * @param {string} title 
     * @param {string} description 
     * @param {number} lifetime miliseconds 
     */
    constructor(title, description, lifetime = 3000) {
        let element = document.createElement('div');
        element.classList.add('notification');
        let t = document.createElement("p");
        t.textContent = title;
        t.id = 'title';
        element.appendChild(t);
        let d = document.createElement("p");
        d.textContent = description;
        element.appendChild(d);
        document.body.appendChild(element);
        this.element = element;
        if (lifetime != -1) {
            setTimeout(() => {
                this.remove();
            }, lifetime);
        }
    }

    remove() {
        this.element.remove();
    }
}

export { Notification };