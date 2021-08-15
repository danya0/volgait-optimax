import {cssUrl} from "./utils";

class VirtualMirrorWidget {
    readonly cdnServer = '/' // В дальнейшем вы можете изменить путь к cmd серверу и разместить на нем: js, css, html файлы отснсящиеся к виджету.
    readonly assetsFolder = 'assets/'
    readonly widgetSettings = {
        initId: 'virtual-mirror-widget',
        htmlFileLocation: this.cdnServer + 'widget.html',
        cssFileLocation: this.cdnServer + 'css/widget.css',
        imagesLocation: {
            logo: this.cdnServer + this.assetsFolder + 'logo.png',
            profile: this.cdnServer + this.assetsFolder + 'woman.png'
        }
    }

    widgetContainer = null

    constructor() {
        this.init()
    }

    init(): void {
        this.loadStyleFile()

        this.widgetContainer = document.querySelector(`#${this.widgetSettings.initId}`)
        this.widgetContainer.dataset.virtualMirrorWidget = '' // add the date attribute to add styles
        this.widgetContainer.textContent = 'Wait a second, the widget is loading...'

        fetch(this.widgetSettings.htmlFileLocation)
            .then((response) => response.ok
                ? response.text()
                : 'An error occurred while loading the widget. For more information, see the developer console.')
            .then((html) => {
                this.widgetContainer.innerHTML = html

                this.loadImages()
                this.rangeListener()
            })
            .catch((error) => {
                this.widgetContainer.textContent = 'An error occurred while loading the widget. For more information, see the developer console'
                console.warn(error)
            })
    }

    loadStyleFile() {
        const style = document.createElement('link')
        style.rel = 'stylesheet'
        style.type = 'text/css'
        style.href = this.widgetSettings.cssFileLocation
        document.head.appendChild(style)
    }

    loadImages() {
        this.widgetContainer.querySelector(`#logo`).style.backgroundImage = cssUrl(this.widgetSettings.imagesLocation.logo)
        this.widgetContainer.querySelector(`#profile`).style.backgroundImage = cssUrl(this.widgetSettings.imagesLocation.profile)
    }

    rangeListener() {
        const range = this.widgetContainer.querySelectorAll('input[type="range"]')
        const progress = this.widgetContainer.querySelectorAll('input[type="range"] + .progress')
        range.forEach((item, idx) => {
            item.addEventListener('input',e => {
                const {min, max, value: val} = e.target
                let f = (val - min) * 100 / (max - min)
                progress[idx].style.width = f < 10 ? f + 3 + '%' : f + '%' // + 3 - so that the border radius is not visible
            })
        })
    }
}

new VirtualMirrorWidget()
