import { createContext, useContext, useCallback, useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface CarouselContextValue {
  emblaRef: ReturnType<typeof useEmblaCarousel>[0]
  emblaApi: EmblaCarouselType | undefined
  canScrollPrev: boolean
  canScrollNext: boolean
  selectedIndex: number
  scrollSnaps: number[]
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const ctx = useContext(CarouselContext)
  if (!ctx) throw new Error('useCarousel must be used within <Carousel />')
  return ctx
}

/* ─────────────────────────────────────────────
   Root
   ───────────────────────────────────────────── */
interface CarouselProps {
  children: ReactNode
  opts?: EmblaOptionsType
  plugins?: EmblaPluginType[]
  autoplay?: boolean | number
  className?: string
}

export function Carousel({
  children,
  opts,
  plugins = [],
  autoplay,
  className,
}: CarouselProps) {
  const autoplayPlugin = autoplay
    ? [Autoplay({ delay: typeof autoplay === 'number' ? autoplay : 4000, stopOnInteraction: true })]
    : []

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, ...opts }, [...autoplayPlugin, ...plugins])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setSelectedIndex(api.selectedScrollSnap())
  }, [])

  const onInit = useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onInit(emblaApi)
    onSelect(emblaApi)
    emblaApi.on('reInit', onInit)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('select', onSelect)
  }, [emblaApi, onInit, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  return (
    <CarouselContext.Provider value={{ emblaRef, emblaApi, canScrollPrev, canScrollNext, selectedIndex, scrollSnaps, scrollPrev, scrollNext, scrollTo }}>
      <div className={cn('embla', className)}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/* ─────────────────────────────────────────────
   Viewport + Container
   ───────────────────────────────────────────── */
export function CarouselViewport({ children, className }: { children: ReactNode; className?: string }) {
  const { emblaRef } = useCarousel()
  return (
    <div className={cn('embla__viewport', className)} ref={emblaRef}>
      <div className="embla__container">{children}</div>
    </div>
  )
}

export function CarouselSlide({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('embla__slide', className)}>{children}</div>
}

/* ─────────────────────────────────────────────
   Navigation buttons
   ───────────────────────────────────────────── */
export function CarouselPrevButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { canScrollPrev, scrollPrev } = useCarousel()
  return (
    <button
      className={cn('embla__btn embla__btn--prev', className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      ◀
    </button>
  )
}

export function CarouselNextButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { canScrollNext, scrollNext } = useCarousel()
  return (
    <button
      className={cn('embla__btn embla__btn--next', className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      ▶
    </button>
  )
}

/* ─────────────────────────────────────────────
   Dots (pagination)
   ───────────────────────────────────────────── */
export function CarouselDots({ className }: { className?: string }) {
  const { selectedIndex, scrollSnaps, scrollTo } = useCarousel()
  return (
    <div className={cn('embla__dots', className)}>
      {scrollSnaps.map((_, i) => (
        <button
          key={i}
          className={cn('embla__dot', i === selectedIndex && 'embla__dot--active')}
          onClick={() => scrollTo(i)}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  )
}
