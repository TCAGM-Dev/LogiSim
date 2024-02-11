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

    constructor(name = UNNAMED_CHIP_NAME, inputs = [], outputs = [], gates = [], color) {
        this.name = name
        this.#inputs = inputs
        this.#outputs = outputs
        this.#gates = gates
        this.color = color ?? `#${hexLengthen(Math.floor(Math.random() * 2 ** 8).toString(16), 2) + hexLengthen(Math.floor(Math.random() * 2 ** 8).toString(16), 2) + hexLengthen(Math.floor(Math.random() * 2 ** 8).toString(16), 2)}`

        Chip.#chips.push(this)
    }

    open() {
        Chip.#currentid = this.id
        return this
    }

    delete() {
        if (this.name == MAIN_CHIP_NAME) return
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

    constructor(id, x = 0, y = 0) {
        this.#chipid = id
        this.#position = new Vector2(x, y)
    }

    get id() {
        return this.#chipid
    }

    get position() {
        return this.#position
    }

    render() {
        Chip.get(this.#chipid).renderSelf(this.#position.x, this.#position.y)
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

    updateUI()

    window.requestAnimationFrame(frameloop)
}

init()