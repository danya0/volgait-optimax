class VirtualMirrorWidget {
    widgetSettings = {
        initId: 'virtual-mirror-widget',
        htmlFileLocation: './widget.html', // В дальнейшем вы можете разместить файл на отдельном CDN и указать путь к нему.
        cssFileLocation: 'css/widget.css', // В дальнейшем вы можете разместить файл на отдельном CDN и указать путь к нему.
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
                widgetContainer.innerHTML = html;
            })
            .catch((error) => {
                widgetContainer.textContent = 'An error occurred while loading the widget. For more information, see the developer console'
                console.warn(error);
            });
    }

    loadStyleFile() {
        const style = document.createElement('link')
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = this.widgetSettings.cssFileLocation;
        document.head.appendChild(style);
    }
}

new VirtualMirrorWidget()
