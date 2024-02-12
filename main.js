const root = document.documentElement
const view = document.getElementById("view")
const chipselect = document.getElementById("chipselect")

const ACTIVE_COLOR = "#e81f10"
const INACTIVE_COLOR = "#333333"

const MAIN_CHIP_NAME = "MAIN"
const NOT_CHIP_NAME = "NOT"
const OR_CHIP_NAME = "OR"
const UNNAMED_CHIP_NAME = "unnamed"

const MAXIMUM_SCALE = 200
const MINIMUM_SCALE = 10
const DEFAULT_SCALE = 20

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    squaredMagnitude() {
        return this.x * this.x + this.y * this.y
    }
    magnitude() {
        return Math.sqrt(this.squaredMagnitude())
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y)
    }
    setAdd(v) {
        this.x += v.x
        this.y += v.y
        return this
    }
    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y)
    }
    setSubtract(v) {
        this.x -= v.x
        this.y -= v.x
        return this
    }
    invert() {
        return new Vector2(-this.x, -this.y)
    }
    setInvert() {
        this.x = -this.x
        this.y = -this.y
        return this
    }
    multiply(n) {
        return new Vector2(this.x * n, this.y * n)
    }
    setMultiply(n) {
        this.x *= n
        this.y *= n
        return this
    }
    divide(n) {
        return new Vector2(this.x / n, this.y / n)
    }
    setDivide(n) {
        this.x /= n
        this.y /= n
        return this
    }
    normalize() {
        return this.divide(this.magnitude())
    }
    setNormalize() {
        return this.setDivide(this.magnitude())
    }
}

function hexLengthen(hex, amount) {
    while (hex.length < amount) {
        hex = "0" + hex
    }
    return hex
}

class Chip {
    static #chips = []
    static #currentid
    name
    #gates
    #inputs
    #outputs
    #handler

    constructor(name = UNNAMED_CHIP_NAME, inputs = [], outputs = [], gates = [], color, handler) {
        this.name = name
        this.#inputs = inputs
        this.#outputs = outputs
        this.#gates = gates
        this.color = color ?? `#${hexLengthen(Math.floor(Math.random() * 2 ** 8).toString(16), 2) + hexLengthen(Math.floor(Math.random() * 2 ** 8).toString(16), 2) + hexLengthen(Math.floor(Math.random() * 2 ** 8).toString(16), 2)}`
        this.#handler = handler

        Chip.#chips.push(this)
    }

    open() {
        if (!this.#handler) Chip.#currentid = this.id
        return this
    }

    delete() {
        if (this.name == MAIN_CHIP_NAME || this.#handler) return
        if (this.id == Chip.#currentid) Chip.#currentid--
        Chip.#chips.splice(this.id, 1)
    }

    setColor(color) {
        this.color = color
        return this
    }

    setName(name) {
        this.name = name
        return this
    }

    get id() {
        return Chip.#chips.findIndex(chip => chip == this)
    }

    static getCurrent() {
        return Chip.#chips[Chip.#currentid]
    }

    static get(id) {
        if (id == null) {
            return Chip.#chips
        }

        return Chip.#chips[id]
    }

    get handler() {
        return this.#handler
    }

    get inputs() {
        return this.#inputs
    }
    get outputs() {
        return this.#outputs
    }

    renderSelf(x, y) {

    }

    render() {
        this.#gates.forEach(gate => gate.render())
    }
}

function hexToValue(hex) {
    if (hex.startsWith("#")) hex = hex.slice(1)
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return (r + g + b) / 3
}

class Gate {
    #chipid
    #position
    #inputs
    #outputs

    constructor(chip, parent, x = 0, y = 0) {
        this.#chipid = chip.id
        this.#position = new Vector2(x, y)
        this.#inputs = chip.inputs.map(v => v.clone())
        this.#outputs = chip.outputs.map(v => v.clone())
    }

    get id() {
        return this.#chipid
    }

    get position() {
        return this.#position
    }

    get chip() {
        return Chip.get(this.#chipid)
    }

    render() {
        Chip.get(this.#chipid).renderSelf(this.#position.x, this.#position.y)
    }

    update() {
        this.chip.handler(this.inputs, this.outputs)
    }
}

class Pin {
    #active
    #next = []

    constructor(name) {
        this.name = name
        this.#active = false
    }

    active() {
        return this.#active
    }
    set(bool) {
        if (this.#active != bool) {
            this.#active = bool
            this.#next.forEach(v => v.update())
        }
    }

    clone() {
        return new Pin(this.name)
    }
}

let unitscale = DEFAULT_SCALE

function updateBackground() {
    root.style.setProperty("--background-scale", `${unitscale}px`)
}

function updateChipSelect() {
    chipselect.innerHTML = Chip.get().map(chip => `<div data-chipid="${chip.id}" class="chipselectbutton${Chip.getCurrent().id == chip.id ? " selected" : ""} ${hexToValue(chip.color) < 128 ? "dark" : "light"}" onclick="Chip.get(${chip.id}).open(); updateChipSelect()" style="background-color: ${chip.color}">${chip.name}${chip.name == MAIN_CHIP_NAME ? "" : `<button class="deletebutton" onclick="Chip.get(${chip.id}).delete(); updateChipSelect()">x</button>`}</div>`).join("") + `<button id="chipaddbutton" onclick="new Chip().open(); updateChipSelect()">+</button>`
}

function updateUI() {
    updateChipSelect()
}

function render() {
    updateBackground()

    Chip.getCurrent().render()
}

function update() {
    
}

function frame(delta, time) {
    update()

    render()
}

let lasttime = performance.now()

function frameloop(time) {
    frame(time - lasttime, time)
    window.requestAnimationFrame(frameloop)
    lasttime = time
}

function registerEvents() {
    root.addEventListener("wheel", event => {
        if (event.target == view) {
            unitscale *= 1.001 ** -event.deltaY
            if (unitscale > MAXIMUM_SCALE) {
                unitscale = MAXIMUM_SCALE
            } else if (unitscale < MINIMUM_SCALE) {
                unitscale = MINIMUM_SCALE
            }
        }
    })
    root.addEventListener("contextmenu", event => {
        if (event.target.parentElement == chipselect && event.target.getAttribute("data-chipid") != "0") {
            event.preventDefault()

            event.target.setAttribute("contenteditable", "true")
            event.target.querySelector(".deletebutton").remove()

            const range = document.createRange()
            range.selectNodeContents(event.target)
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)

            event.target.addEventListener("keydown", handler = e => {
                if (e.code == "Enter") {
                    e.preventDefault()
                    event.target.removeEventListener("keydown", handler)

                    event.target.setAttribute("contenteditable", "false")
                    Chip.get(parseInt(event.target.getAttribute("data-chipid"))).setName(event.target.innerText)
                    updateChipSelect()
                }
            })
        }
    })
}

function init() {
    registerEvents()

    new Chip(MAIN_CHIP_NAME).setColor("var(--ui-accent-color)").open()
    new Gate(new Chip("OR", [new Pin(), new Pin()], [new Pin()], [], "#ff0000", (inputs, outputs) => {
        outputs[0].set(inputs[0].active() || inputs[1].active())
    }), Chip.getCurrent())
    

    updateUI()

    window.requestAnimationFrame(frameloop)
}

init()