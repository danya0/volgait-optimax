import '../scss/widget.scss'
import {cssUrl} from "./utils"
import Swiper from 'swiper/bundle';
import 'swiper/swiper-bundle.css';

enum States {
    AllowCamera = 'allow',
    Menu = 'menu-opened'
}

class VirtualMirrorWidget {
    readonly cdnServer = '/' // В дальнейшем вы можете изменить путь к cmd серверу и разместить на нем: js, css, html файлы отснсящиеся к виджету.
    readonly assetsFolder = 'assets/'
    readonly wOptions = {
        initId: 'virtual-mirror-widget',
        htmlFileLocation: this.cdnServer + 'widget.html',
        lensUrl: '',
        imagesLocation: {
            logo: this.cdnServer + this.assetsFolder + 'logo.png',
            profile: this.cdnServer + this.assetsFolder + 'woman.png'
        }
    }

    controls = {
        choose: 'choose-btn',
        back: 'back-btn',
        upload: 'upload-btn',
        lens: 'lens',
        infoLens: 'info-lens',
        pd: 'pd',
        size: 'size',
        rotate: 'rotate',
        reset: 'reset'
    }

    wContainer = null
    wEl = null

    constructor() {
        this.init()
    }

    init(): void {
        // this.loadStyleFile()

        this.wContainer = document.querySelector(`#${this.wOptions.initId}`)
        this.wContainer.dataset.virtualMirrorWidget = '' // add the date attribute to add styles
        this.wContainer.textContent = 'Wait a second, the widget is loading...'

        fetch(this.wOptions.htmlFileLocation)
            .then((response) => response.ok
                ? response.text()
                : 'An error occurred while loading the widget. For more information, see the developer console.')
            .then((html) => {
                this.wContainer.innerHTML = html
                this.wEl = this.wContainer.childNodes[0]

                this.loadImages()
                this.rangeListener()
                this.addListeners()
                this.createSlider()
            })
            .catch((error) => {
                this.wContainer.textContent = 'An error occurred while loading the widget. For more information, see the developer console'
                console.warn(error)
            })
    }

    loadImages(): void {
        this.wContainer.querySelector(`#logo`).style.backgroundImage = cssUrl(this.wOptions.imagesLocation.logo)
        this.wContainer.querySelector(`#profile`).style.backgroundImage = cssUrl(this.wOptions.imagesLocation.profile)
    }

    createSlider(): void {
        new Swiper('.goods-block', {})
    }

    rangeListener(reset?: boolean): void {
        const ranges = this.wContainer.querySelectorAll('input[type="range"]')
        const progress = this.wContainer.querySelectorAll('input[type="range"] + .progress')

        if (reset) {
            progress.forEach(item => item.style.width = 0)
            ranges.forEach(r => r.value = 0)
            return
        }

        ranges.forEach((item, idx) => {
            item.addEventListener('input', e => {
                const {min, max, value: val} = e.target
                let f = (val - min) * 100 / (max - min)
                progress[idx].style.width = f < 10 ? f + 3 + '%' : f + '%' // + 3 - so that the border radius is not visible
            })
        })
    }

    setStateWidget(className: States, remove?: boolean): void {
        if (remove) {
            this.wEl.classList.remove(<string>className)
        } else {
            this.wEl.classList.add(<string>className)
        }
    }

    addListeners(): void {
        const buttonsEvents = {
            choose: () => {
                this.setStateWidget(States.Menu)
            },
            back: () => {
                this.setStateWidget(States.Menu, true)
            },
            upload: () => {
                this.setStateWidget(States.AllowCamera)
            },
            pd: () => {

            },
            size: () => {

            },
            rotate: () => {

            },
            reset: () => {
                this.rangeListener(true)
                // this.controls.pd.value = 64
            }
        }

        Object.keys(this.controls).map(key => {
            const selector = this.wContainer.querySelector(`#${this.controls[key]}`)
            this.controls[key] = selector
            selector.addEventListener('click', buttonsEvents[key])
        })
    }
}

new VirtualMirrorWidget()
