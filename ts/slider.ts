import '../scss/slider.scss'

interface ISlider {
    $wrap: HTMLElement | null
    $slides: HTMLElement | null
    $carousel: HTMLElement | null
    currentSlide: number
    init(): void
}

type Configuration = {
    slidesPerView?: number,
    slidesToScroll?: number
    breakpoints?: {
        [key: number]: {
            slidesPerView?: number
        }
    }
}

export default class Slider implements ISlider{
    configuration: Configuration = {
        slidesPerView: 3,
        slidesToScroll: 1
    }
    slidesPerViewDefault: number = null
    currentSlide = 0
    slidesToScroll = null

    $wrap = null
    $slides = null
    $carousel = null
    $arrowButtons = {
        prev: null,
        next: null
    }
    slideWidth: number = null

    constructor(
        public selectorWrap: string,
        userConfiguration?: Configuration
    ) {
        // Change on user configuration
        if (userConfiguration) {
            this.configuration = {
                ...this.configuration,
                ...userConfiguration
            }
        }

        // Init slider
        this.init()
    }

    init() {
        this.$wrap = document.querySelector(this.selectorWrap)
        this.$wrap.classList.add('slider-plugin')
        this.$slides = this.$wrap.querySelectorAll('.slider-slide')
        this.$carousel = this.$wrap.querySelector('.slider-wrapper')

        this.calculateHowManySlideCanScroll()
        this.calculateSlideWidth()
        this.findArrowButtons()
        this.arrowButtonsListeners()

        this.checkBreakpoints()

        window.addEventListener('resize', () => {
            this.calculateSlideWidth()
        })
    }

    calculateHowManySlideCanScroll() {
        this.slidesToScroll = this.$slides.length - this.configuration.slidesPerView
    }

    calculateSlideWidth() {
        const padding: number = +window.getComputedStyle(this.$wrap).padding.split(' ')[1].split('px')[0]

        this.slideWidth = (this.$wrap.clientWidth - padding * 2) / this.configuration.slidesPerView

        this.$slides.forEach(slide => {
            slide.style.flex = '0 0 ' + this.slideWidth + 'px'
        })
    }

    findArrowButtons() {
        this.$arrowButtons.prev = this.$wrap.querySelector('.slider-button-prev')
        this.$arrowButtons.next = this.$wrap.querySelector('.slider-button-next')
    }

    arrowClick(next: boolean) {
        const prev = this.currentSlide
        if (next && this.slidesToScroll > this.currentSlide) {
            this.currentSlide++
        } else if (!next && this.currentSlide !== 0){
            this.currentSlide--
        }

        if (prev !== this.currentSlide) {
            this.moveSlide()
        }
    }

    arrowButtonsListeners() {
        this.$arrowButtons.prev.addEventListener('click', () => {this.arrowClick(false)})
        this.$arrowButtons.next.addEventListener('click', () => {this.arrowClick(true)})
    }

    moveSlide() {
        const formula = this.slideWidth * this.currentSlide
        this.$carousel.style.transform = `translateX(-${formula}px)`
    }

    checkBreakpoints() {
        if (!this.configuration.breakpoints) {
            return
        }

        this.slidesPerViewDefault = this.configuration.slidesPerView

        const breakpointsFn = () => {
            // an array of effective breakpoints greater than or equal to the screen width
            const arr = Object.keys(this.configuration.breakpoints).filter(breakpoint => +breakpoint >= window.innerWidth)

            function calcMinBreakPoint(): number {
                let min = null
                arr.forEach(item => min > +item || min === null ? min = +item : null)
                return min
            }

            // finding the minimum breakpoint to set its parameters
            const minBreakPoint = calcMinBreakPoint()

            this.configuration.slidesPerView = minBreakPoint ? this.configuration.breakpoints[minBreakPoint].slidesPerView : this.slidesPerViewDefault

            // then count how many slides you can scroll through
            this.calculateHowManySlideCanScroll()

            // then calculate the width of one slide
            this.calculateSlideWidth()
        }

        // call on window load
        breakpointsFn()

        // add resize listener
        window.addEventListener('resize', breakpointsFn)
    }
}