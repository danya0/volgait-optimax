class VirtualMirrorWidget {
    readonly cdnServer = '/' // В дальнейшем вы можете изменить путь к cmd серверу и разместить на нем: js, css, html файлы отснсящиеся к виджету.
    readonly widgetSettings = {
        initId: 'virtual-mirror-widget',
        htmlFileLocation: this.cdnServer + 'widget.html',
        cssFileLocation: this.cdnServer + 'css/widget.css', // todo: сделать расположение файлов одноуровневым
    }

    constructor() {
        this.init()
        this.loadStyleFile()
    }

    init(): void {
        const widgetContainer = document.getElementById(this.widgetSettings.initId)
        widgetContainer.textContent = 'Wait a second, the widget is loading...'

        fetch(this.widgetSettings.htmlFileLocation)
            .then((response) => response.ok
                ? response.text()
                : 'An error occurred while loading the widget. For more information, see the developer console.')
            .then((html) => {
                widgetContainer.innerHTML = html
            })
            .catch((error) => {
                widgetContainer.textContent = 'An error occurred while loading the widget. For more information, see the developer console'
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
}

new VirtualMirrorWidget()
