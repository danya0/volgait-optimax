import '../scss/widget.scss'
import {$cssUrl} from "./utils"
import Swiper from 'swiper/bundle';
import 'swiper/swiper-bundle.css';

enum States {
    AllowCamera = 'allow',
    Menu = 'menu-opened',
    Camera = 'camera',
    Loader = 'loader'
}

enum TryonButtonState {
    Upload = 'Upload',
    Snap = 'Snapshot',
    Retake = 'Retake'
}

class VirtualMirrorWidget {
    readonly cdnServer = '/' // В дальнейшем вы можете изменить путь к c серверу и разместить на нем: js, css, html файлы отснсящиеся к виджету.
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
        title: 'title',
        description: 'description',
        infoLens: 'info-lens',
        choose: 'choose-btn',
        back: 'back-btn',
        tryonBtn: 'tryon-btn',
        tryonBtnText: 'tryon-btn span',
        lens: 'lens',
        pd: 'pd',
        size: 'size',
        rotate: 'rotate',
        reset: 'reset'
    }
    lens = []
    activeLens = 0
    wContainer = null
    wEl = null
    tryonButtonState = TryonButtonState.Upload
    videoSettings = {
        width: 320,
        height: 0,
        streaming: false,
        canvas: null,
        video: null,
        stream: null,
        allow: false
    }

    constructor() {
        this.init()
    }

    init(): void {
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

                this.findControls()
                this.loadImages()
                this.loadLens()
                this.rangeListener()
                this.addListeners()
            })
            .catch((error) => {
                this.wContainer.textContent = 'An error occurred while loading the widget. For more information, see the developer console'
                console.warn(error)
            })
    }

    loadImages(): void {
        this.wContainer.querySelector(`#logo`).style.backgroundImage = $cssUrl(this.wOptions.imagesLocation.logo)
        this.wContainer.querySelector(`#profile`).style.backgroundImage = $cssUrl(this.wOptions.imagesLocation.profile)
    }

    findControls(): void {
        Object.keys(this.controls).map(key => {
            this.controls[key] = this.wContainer.querySelector(`#${this.controls[key]}`)
        })
    }

    createSlider(): void {
        new Swiper('.goods-block', {
            slidesPerView: 3,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
        })
    }

    loadLens(): void {
        const wrap = document.querySelector('.goods-block .swiper-wrapper')
        fetch('https://optimaxdev.github.io/volga-it/response.json')
            .then(res => res.json())
            .then(data => {
                const lensTemplate = (name: string, image: string, id: number) => (`
                    <div class="swiper-slide">
                      <div class="goods__item" data-lens-id="${id}">
                        <img src="${image}" alt="lens" class="goods__lens"/>
                        <div class="goods__name">${name}</div>
                      </div>
                    </div>
                `)
                const lens = []

                console.log(data.items)

                data.items.map((l, i) => lens.push(lensTemplate(l.name, l.image, i)))
                wrap.innerHTML = lens.join('')
                this.lens = data.items
                this.changeLensInfo(data.items[this.activeLens])

                this.createSlider()
                this.clickLens(wrap)
            })
            .catch(e => {
                console.log(e.message)
                wrap.textContent = 'Something went wrong while loading data'
            })
    }

    changeLensInfo(lensItem): void {
        const {name, description, image, mirror_frame: mirrorFrame, width: frameWidth} = lensItem
        const pd = this.controls.pd.value
        const $frameScaleRatio = (frameWidth / 200) / (pd / 100) // Не до конца понял формулу скейла. Скорее всего необходимы правки в данном месте. Чем отличается pd от $distanceBetweenPupilMarks$ - вообще загадка.
        this.controls.lens.style.transform = `scale(${$frameScaleRatio})`

        this.controls.title.textContent = name
        this.controls.description.textContent = description
        this.controls.infoLens.style.backgroundImage = $cssUrl(image)
        this.controls.lens.style.backgroundImage = $cssUrl(mirrorFrame)
    }

    clickLens(wrap): void {
        wrap.addEventListener('click', e => {
            const target = e.target.parentElement
            const lensId = target.dataset.lensId

            if (target.classList.contains('goods__item')) {
                this.activeLens = lensId
                this.changeLensInfo(this.lens[lensId])
            }
        })
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

    loadVideo(): void {
        this.videoSettings.allow ? this.setStateWidget(States.Loader) : this.setStateWidget(States.AllowCamera) // add allow class

        if (!this.videoSettings.allow) {
            this.videoSettings.video = this.wContainer.querySelector('#video')
            this.videoSettings.canvas = this.wContainer.querySelector('#canvas')
        }

        this.videoSettings.canvas.style.zIndex = ''

        navigator.mediaDevices.getUserMedia({video: true})
            .then(stream => {
                this.videoSettings.stream = stream
                this.videoSettings.allow ? this.setStateWidget(States.Loader, true) : this.setStateWidget(States.AllowCamera, true) // remove loader or allow class when stream is ready
                this.videoSettings.allow = true
                this.setStateWidget(States.Camera)
                this.videoSettings.video.srcObject = stream
                this.videoSettings.video.play()
                this.controls.tryonBtnText.textContent = this.tryonButtonState = TryonButtonState.Snap
            })
            .catch(err => {
                console.log("An error occurred: " + err)
            });

        this.videoSettings.video.addEventListener('canplay', () => {
            if (!this.videoSettings.streaming) {
                this.videoSettings.height = this.videoSettings.video.videoHeight / (this.videoSettings.video.videoWidth / this.videoSettings.width)
                if (isNaN(this.videoSettings.height)) {
                    this.videoSettings.height = this.videoSettings.width / (4 / 3)
                }

                this.videoSettings.video.setAttribute('width', this.videoSettings.width.toString())
                this.videoSettings.video.setAttribute('height', this.videoSettings.height.toString())
                this.videoSettings.canvas.setAttribute('width', this.videoSettings.width.toString())
                this.videoSettings.canvas.setAttribute('height', this.videoSettings.height.toString())
                this.videoSettings.streaming = true;
            }
        }, false);
    }

    addListeners(): void {
        const buttonsEvents = {
            choose: () => {
                this.setStateWidget(States.Menu)
            },
            back: () => {
                this.setStateWidget(States.Menu, true)
            },
            tryonBtn: () => {
                if (this.tryonButtonState === TryonButtonState.Upload || this.tryonButtonState === TryonButtonState.Retake) {
                    this.loadVideo()
                } else if (this.tryonButtonState === TryonButtonState.Snap) {
                    this.setStateWidget(States.Menu)
                    this.videoSettings.canvas.style.zIndex = 2
                    this.controls.lens.style.zIndex = 4
                    const context = this.videoSettings.canvas.getContext('2d')
                    this.controls.tryonBtnText.textContent = this.tryonButtonState = TryonButtonState.Retake
                    if (this.videoSettings.width && this.videoSettings.height) {
                        console.log('image')
                        this.videoSettings.canvas.width = this.videoSettings.width
                        this.videoSettings.canvas.height = this.videoSettings.height
                        context.drawImage(this.videoSettings.video, 0, 0, this.videoSettings.width, this.videoSettings.height)

                        this.videoSettings.stream.getTracks().forEach(track => {
                            track.stop();
                        });
                    }
                }
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
            this.controls[key].addEventListener('click', buttonsEvents[key])
        })
    }
}

new VirtualMirrorWidget()
