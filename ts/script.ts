import '../scss/widget.scss'
import {$cssUrl} from './utils'
import $ from 'jquery'
import './plugins/guillotine/jquery.guillotine.min'
import Slider from "./slider";

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
        lensUrl: 'https://optimaxdev.github.io/volga-it/response.json',
        imagesLocation: {
            logo: this.cdnServer + this.assetsFolder + 'logo.png',
            profile: this.cdnServer + this.assetsFolder + 'woman.png'
        }
    }

    readonly controls: { [key: string]: any } = {
        title: 'title',
        description: 'description',
        infoLens: 'info-lens',
        choose: 'choose-btn',
        back: 'back-btn',
        tryonVideoBtn: 'tryon-btn',
        tryonBtnText: 'tryon-btn span',
        lens: 'lens',
        pd: 'pd',
        size: 'size',
        rotate: 'rotate',
        reset: 'reset',
        tryButton: 'tryonAndBack'
    }
    lens = []
    activeLens = 0
    wContainer = null
    wEl = null
    tryonButtonState = TryonButtonState.Upload
    videoSettings = {
        width: 320,
        height: 0,
        pdDefault: 62,
        streaming: false,
        canvas: null,
        video: null,
        stream: null,
        allow: false
    }
    lensDefaultValues: { [key: string]: number } = {}

    guillotineObject = null
    sizeInputValue: number = 0
    rotateInputValue: number = 0

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
                this.findLensDefaultValues()
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
        new Slider('.goods-block', {
            breakpoints: {
                750: {
                    slidesPerView: 1
                }
            }
        })
    }

    loadLens(): void {
        const wrap = document.querySelector('.goods-block .slider-wrapper')
        fetch(this.wOptions.lensUrl)
            .then(res => res.json())
            .then(data => {
                const lensTemplate = (name: string, image: string, id: number) => (`
                    <div class="slider-slide">
                      <div class="goods__item" data-lens-id="${id}">
                        <img src="${image}" alt="lens" class="goods__lens"/>
                        <div class="goods__name">${name}</div>
                      </div>
                    </div>
                `)
                const lens = []

                data.items.map((l, i) => lens.push(lensTemplate(l.name, l.image, i)))
                wrap.innerHTML = lens.join('')
                this.lens = data.items
                this.changeLensInfo(data.items[this.activeLens])

                this.createSlider()
                this.addClickListenerOnLens(wrap)
            })
            .catch(e => {
                console.log(e.message)
                wrap.textContent = 'Something went wrong while loading data'
            })
    }

    changeLensInfo(lensItem): void {
        const {name, description, image, mirror_frame: mirrorFrame, width: frameWidth} = lensItem
        const pd = this.controls.pd.value
        const $frameScaleRatio = (frameWidth / 200) / (pd / 100)
        // Не до конца понял формулу скейла. Поэтому не стал применять её, т.к возникают баги в размерах
        // this.controls.lens.style.transform = `scale(${$frameScaleRatio})`
        this.controls.lens.style.transform = `scale(${1.1})`

        // console.log('scale formula: ', `(frameWidth(${frameWidth}) / 200) / (pd(${pd}) / 100)`)
        // console.log(`${frameWidth / 200} / ${pd / 100}`)
        // console.log($frameScaleRatio)

        this.controls.title.textContent = name
        this.controls.description.textContent = description
        this.controls.infoLens.style.backgroundImage = $cssUrl(image)
        this.controls.lens.style.backgroundImage = $cssUrl(mirrorFrame)
    }

    addClickListenerOnLens(wrap): void {
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

    findLensDefaultValues(): void {
        const style = window.getComputedStyle(this.controls.lens)
        const obj = {
            width: style.width,
            top: style.top,
            left: style.left
        }
        Object.keys(obj).forEach(key => {
            this.lensDefaultValues[key] = +obj[key].split('px')[0]
        })
    }

    addListeners(): void {

        // Функция которая создает экземпляр guillotine
        const createGuillotine = (): void => {
            const cameraWrap = $('.tryon-camera')
            const width: number = cameraWrap.width()
            const height: number = cameraWrap.height()
            this.guillotineObject = $('#virtual-mirror-widget #camera')
            this.guillotineObject.guillotine({width, height})
        }

        // Функция для изменения состояния guillotine
        const stopGuillotine = (stopGuillotine: boolean): void => {
            if (!this.guillotineObject) {
                return
            }

            const guillotineWindow: Element = this.wEl.querySelector('.guillotine-window')
            const className: string = 'default-cursor'

            if (stopGuillotine) {
                guillotineWindow.classList.add(className)
                this.guillotineObject.css('pointerEvents', 'none')
            } else {
                guillotineWindow.classList.remove(className)
                this.guillotineObject.css('pointerEvents', '')
            }
        }

        // Сброс параметров каких-либо пользовательских настроек
        const resetAdjastments = (): void => {
            if (!this.guillotineObject || !this.videoSettings.canvas) {
                return
            }

            for (let i = 0; i < 10; i++) {
                this.guillotineObject.guillotine('zoomOut')
            }
            this.rangeListener(true)
            this.videoSettings.canvas.style.transform = ''
            this.controls.pd.value = this.videoSettings.pdDefault
            this.controls.lens.style.width = this.lensDefaultValues.width + 'px'
        }

        // Функция работы с видеокамерой
        const loadVideo = (): void => {
            this.videoSettings.allow ? this.setStateWidget(States.Loader) : this.setStateWidget(States.AllowCamera)

            if (!this.videoSettings.allow) {
                this.videoSettings.video = this.wContainer.querySelector('#video')
                this.videoSettings.canvas = this.wContainer.querySelector('#canvas')
            }

            this.videoSettings.canvas.style.zIndex = ''

            navigator.mediaDevices.getUserMedia({video: true})
                .then(stream => {
                    this.videoSettings.stream = stream
                    this.videoSettings.allow ? this.setStateWidget(States.Loader, true) : this.setStateWidget(States.AllowCamera, true)
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
            }, false)
        }

        // Установка линз в дефолтное положение
        const setLensInDefaultPositions = (): void => {
            this.controls.lens.style.left = this.lensDefaultValues.left + 'px'
            this.controls.lens.style.top = this.lensDefaultValues.top + 'px'
        }

        // Функция примерки линз
        const tryonLens = (): void => {
            this.setStateWidget(States.Menu, true)
            this.changeLensInfo(this.lens[this.activeLens])
            stopGuillotine(true)
        }

        // Объект котороый хранит внутри себя тип и само действие для элементов объекта controls
        const controlsEvents = {
            // Действие клика
            click: {
                // Элемент (this.controls.choose) которому присваеиваем это действие. Далее по аналогии
                choose: () => {
                    const url: string = this.lens[this.activeLens].url
                    alert(`Переход по ссылке на страницу с очками (..${url})`)
                },
                back: tryonLens,
                tryButton: tryonLens,
                tryonVideoBtn: () => {
                    if (this.tryonButtonState === TryonButtonState.Upload || this.tryonButtonState === TryonButtonState.Retake) {
                        resetAdjastments()
                        loadVideo()
                        setLensInDefaultPositions()
                        this.controls.lens.style.zIndex = ''
                    } else if (this.tryonButtonState === TryonButtonState.Snap) {
                        stopGuillotine(false)
                        this.setStateWidget(States.Menu)
                        createGuillotine()
                        this.videoSettings.canvas.style.zIndex = 2
                        this.controls.lens.style.zIndex = 4
                        this.controls.tryonBtnText.textContent = this.tryonButtonState = TryonButtonState.Retake

                        const context = this.videoSettings.canvas.getContext('2d')
                        if (this.videoSettings.width && this.videoSettings.height) {
                            this.videoSettings.canvas.width = this.videoSettings.width
                            this.videoSettings.canvas.height = this.videoSettings.height
                            context.drawImage(this.videoSettings.video, 0, 0, this.videoSettings.width, this.videoSettings.height)

                            this.videoSettings.stream.getTracks().forEach(track => {
                                track.stop();
                            });
                        }
                    }
                },
                reset: resetAdjastments,
            },
            mousedown: {
                lens: () => {
                    if (!this.wEl.classList.contains(States.Menu)) {
                        return
                    }

                    // Поиск краев за которые лизны не должны выходить
                    const findEdge = (): { rightEdge: number, bottomEdge: number } => {
                        const container: Element = this.wContainer.querySelector('.tryon')
                        const lens = this.controls.lens
                        const contW: number = container.clientWidth
                        const contH: number = container.clientHeight
                        const lensW: number = lens.clientWidth
                        const lensH: number = lens.clientHeight

                        return {
                            rightEdge: contW - lensW,
                            bottomEdge: contH - lensH
                        }
                    }

                    const {rightEdge, bottomEdge} = findEdge()

                    const mouseUp = () => {
                        document.onmousemove = document.onmouseup = null
                    }

                    document.onmousemove = ({movementX, movementY}) => {
                        const getStyle = window.getComputedStyle(this.controls.lens)
                        const leftV: number = parseInt(getStyle.left)
                        const topV: number = parseInt(getStyle.top)

                        const totalLeft: number = leftV + movementX
                        const totalTop: number = topV + movementY
                        if (totalLeft < 0
                            || totalTop < 0
                            || totalTop > bottomEdge
                            || totalLeft > rightEdge && movementX > 0 // Проверяю movementX в случае если рядом с карем был увеличен pd и объект с крестом ушел за край видимости
                        ) {
                            mouseUp()
                            return
                        } else {
                            this.controls.lens.style.left = totalLeft + 'px'
                            this.controls.lens.style.top = totalTop + 'px'
                        }
                    }

                    document.onmouseup = mouseUp
                }
            },
            input: {
                pd: e => {
                    if (e.target.value < 50) {
                        e.target.value = 50
                    } else if (e.target.value > 150) {
                        e.target.value = 150
                    }
                    const value: number = e.target.value - 62
                    this.controls.lens.style.width = this.lensDefaultValues.width + value + 'px'
                },
                size: e => {
                    const value: number = +e.target.value
                    const way: string = this.sizeInputValue < value ? 'zoomIn' : this.sizeInputValue > value ? 'zoomOut' : null
                    const gap: number = Math.abs(value - this.sizeInputValue)
                    this.sizeInputValue = value

                    for (let i = 0; i < gap; i++) {
                        this.guillotineObject.guillotine(way)
                    }
                },
                rotate: e => {
                    const value: number = +e.target.value
                    this.rotateInputValue = value

                    this.videoSettings.canvas.style.transform = `rotate(${value}deg)`
                }
            }
        }

        // Далее для элементов управления указанных в обхекте controls, присваиваются действия определяемые в объекте controlsEvents
        Object.keys(controlsEvents).map(action => {
            Object.keys(controlsEvents[action]).map(key => {
                this.controls[key].addEventListener(action, controlsEvents[action][key])
            })
        })
    }
}

new VirtualMirrorWidget()
