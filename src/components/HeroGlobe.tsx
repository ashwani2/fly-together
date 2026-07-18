import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { cn } from "@/lib/utils";

// Major hubs [lat, lng] used as arc endpoints + markers, to read as a
// worldwide communication network.
const CITIES: Record<string, [number, number]> = {
  london: [51.5, -0.12],
  newYork: [40.71, -74.0],
  toronto: [43.65, -79.38],
  saoPaulo: [-23.55, -46.63],
  delhi: [28.61, 77.21],
  dubai: [25.2, 55.27],
  singapore: [1.35, 103.82],
  tokyo: [35.68, 139.69],
  sydney: [-33.87, 151.21],
  capeTown: [-33.92, 18.42],
};

const ARC_PAIRS: [keyof typeof CITIES, keyof typeof CITIES][] = [
  ["london", "newYork"],
  ["london", "delhi"],
  ["london", "toronto"],
  ["london", "capeTown"],
  ["newYork", "saoPaulo"],
  ["delhi", "singapore"],
  ["dubai", "london"],
  ["tokyo", "singapore"],
  ["singapore", "sydney"],
  ["tokyo", "newYork"],
];

/**
 * Decorative dotted-globe backdrop for the hero section.
 *
 * Rendered with `cobe` (tiny WebGL globe): real landmasses drawn as dots that
 * slowly auto-rotate, tinted in the brand blue. Purely decorative, so the
 * canvas is aria-hidden and pointer-events-none.
 *
 * Performance notes — this is a faint, full-bleed *watermark* behind the hero
 * content, so it's tuned to cost as little as possible:
 *   - The expensive WebGL setup (shader compile + dot sampling) is deferred off
 *     the initial mount via requestIdleCallback, so it never blocks first paint
 *     or interactivity — this is what stops the landing page hitching on load.
 *   - A small, DPR-1 render buffer is CSS-upscaled to hero size, keeping the
 *     per-frame fragment-shader cost low.
 *   - The render loop only runs while genuinely on-screen and the tab is active,
 *     and is skipped entirely under prefers-reduced-motion.
 */
export function HeroGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;

    // Fixed, modest render buffer (DPR 1), CSS-upscaled to the hero size. Since
    // the globe is faint and blurred behind content, a small buffer is plenty
    // and keeps GPU cost per frame low. Smaller again on phones.
    const SIZE = isMobile ? 320 : 640;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let phi = 0;
    let raf = 0;
    let last = performance.now();
    let running = false;
    let visible = false;
    let idle = 0;

    // Time-based rotation → constant angular speed regardless of frame rate, so
    // it's smooth on 60Hz and 120Hz alike. Delta is clamped so a stalled frame
    // (tab switch, GC pause) resumes gently instead of snapping forward.
    const SPEED = 0.00006; // rad/ms — calm, premium drift (~105s per turn)

    const tick = (now: number) => {
      const dt = Math.min(now - last, 48);
      last = now;
      phi += SPEED * dt;
      globe?.update({ phi });
      raf = requestAnimationFrame(tick);
    };

    // Only run the render loop while the globe is genuinely on-screen and the tab
    // is active. Scrolling past the hero (or mobile, where it's hidden) costs
    // nothing — this is the key to smooth scrolling elsewhere on the page.
    const ensure = () => {
      if (!globe) return;
      const shouldRun = !reduceMotion && visible && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        ensure();
      },
      { threshold: 0 },
    );
    const onVisibility = () => ensure();

    // Build the globe once the browser is idle, off the hero's critical mount
    // path. `createGlobe` compiles shaders and samples thousands of continent
    // dots synchronously, so doing it here avoids a main-thread stall on load.
    const init = () => {
      if (!canvasRef.current) return;

      try {
        globe = createGlobe(canvas, {
          devicePixelRatio: 1,
          width: SIZE,
          height: SIZE,
          phi: 0,
          theta: 0.28,
          dark: 0, // light globe to sit on the pale hero background
          diffuse: 0.85, // gentle shading — soft, not a glossy ball
          mapSamples: isMobile ? 11000 : 16000, // dense enough for a faint backdrop
          mapBrightness: 4.2, // subtle but legible continents
          baseColor: [0.84, 0.89, 0.98], // very pale, airy blue sphere
          markerColor: [0.2, 0.3, 0.66],
          glowColor: [0.92, 0.95, 1], // soft halo, no harsh rim
          markers: Object.values(CITIES).map((location) => ({ location, size: 0.03 })),
          // Communication network: thin, understated arcs between hubs.
          arcs: ARC_PAIRS.map(([from, to]) => ({ from: CITIES[from], to: CITIES[to] })),
          arcColor: [0.32, 0.43, 0.78],
          arcWidth: 0.55,
          arcHeight: 0.42,
        });
      } catch {
        // No WebGL / context creation failed — leave the canvas blank rather than
        // breaking the hero. The globe is purely decorative.
        return;
      }

      if (reduceMotion) {
        // Honour reduced-motion: paint a single static frame, no render loop.
        globe.update({ phi });
        return;
      }

      io.observe(canvas);
      document.addEventListener("visibilitychange", onVisibility);
    };

    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(init, { timeout: 1500 });
    } else {
      idle = window.setTimeout(init, 200);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idle);
      } else {
        clearTimeout(idle);
      }
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      globe?.destroy();
    };
  }, []);

  return (
    <div aria-hidden className={cn("pointer-events-none select-none", className)}>
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ aspectRatio: "1 / 1" }}
      />
    </div>
  );
}
