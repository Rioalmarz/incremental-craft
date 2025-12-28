import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import flowerImage from '@/assets/flower-logo.png';
gsap.registerPlugin(ScrollTrigger);
const ScrollScaleSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  useGSAP(() => {
    if (!imageRef.current || !containerRef.current) return;
    gsap.fromTo(imageRef.current, {
      scale: 0.5,
      opacity: 0.3
    }, {
      scale: 1.2,
      opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1
      }
    });
  }, {
    scope: containerRef
  });
  return <section ref={containerRef} className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="text-center">
        <img ref={imageRef} src={flowerImage} alt="Scroll animated image" className="w-48 h-48 md:w-64 md:h-64 object-contain mx-auto" />
        <p className="mt-8 text-muted-foreground text-lg">
      </p>
      </div>
    </section>;
};
export default ScrollScaleSection;