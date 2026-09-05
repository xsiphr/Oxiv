'use client';

import React, { useState, useEffect, useId, useRef, useCallback } from 'react';
import { ExtractionStatus } from '@/types';

export interface OxiProps {
  /** Extraction lifecycle status */
  status?: ExtractionStatus;
  /** Visual variant (unified portal by default) */
  variant?: 'portal' | 'standalone';
  /** Dimension size in pixels or CSS string */
  size?: number | string;
  /** Whether mouse pointer tracks eyes globally */
  interactive?: boolean;
  /** Explicit roof tilt override */
  roofTilt?: 'left' | 'right' | 'flat' | 'auto';
  /** Whether the input field is currently focused (Oxi glances down attentively) */
  isFocused?: boolean;
  /** Counter or signal trigger to execute an attentive perk-up nod */
  nodSignal?: number;
  /** Additional CSS class names */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
  /** Optional click handler */
  onClick?: () => void;
}

export type RoofTiltDirection = 'left' | 'right' | 'flat';

export type MobileMood =
  | 'center'
  | 'look-right'
  | 'look-left'
  | 'ponder'
  | 'squint-scan'
  | 'alert';

interface AutoMoodConfig {
  mood: MobileMood;
  duration: number;
  tilt: RoofTiltDirection;
  gaze: { x: number; y: number };
  eyeScale?: { leftH?: number; rightH?: number; w?: number };
}

/**
 * Sequence of autonomous moods for mobile (touchscreens) and stationary idle states.
 * Cycles dynamically through diverse roof tilts, inquisitive looks, ponderings, and expressions.
 */
const AUTO_MOODS: AutoMoodConfig[] = [
  { mood: 'center', duration: 3200, tilt: 'flat', gaze: { x: 0, y: 0 } },
  { mood: 'look-right', duration: 3600, tilt: 'right', gaze: { x: 4.2, y: 0.6 } },
  { mood: 'center', duration: 2000, tilt: 'flat', gaze: { x: 0, y: 0 } },
  {
    mood: 'look-left',
    duration: 3600,
    tilt: 'left',
    gaze: { x: -4.2, y: -0.6 },
    eyeScale: { leftH: 5.6, rightH: 4.2 }
  },
  {
    mood: 'ponder',
    duration: 3200,
    tilt: 'flat',
    gaze: { x: 2.2, y: -2.8 },
    eyeScale: { leftH: 4.2, rightH: 4.2 }
  },
  {
    mood: 'squint-scan',
    duration: 2800,
    tilt: 'right',
    gaze: { x: -2.0, y: 1.0 },
    eyeScale: { leftH: 3.2, rightH: 3.2, w: 8.5 }
  },
  {
    mood: 'alert',
    duration: 2400,
    tilt: 'flat',
    gaze: { x: 0, y: -1.0 },
    eyeScale: { leftH: 6.2, rightH: 6.2 }
  }
];

/**
 * Oxi — Oxiv's official interactive geometric mascot & brandmark.
 *
 * Kinematics & Expression Architecture:
 * 1. 3-Way Dynamic Roof Morphing:
 *    - tilt-right (Left peak 22, Right peak 36) -> cursor right, look-right mood, extracting
 *    - tilt-left  (Left peak 36, Right peak 22) -> cursor left, look-left mood, error
 *    - flat       (Left peak 26, Right peak 26) -> cursor center, ponder/alert mood, sleeping, success
 * 2. Expressive Eye States & Multi-Cadence Blinking:
 *    - Biological Blinking: Randomized single-blinks, double-blinks, and soft contemplation blinks
 *    - Mobile Autonomous Exploration: Autonomous routine alternating roof tilts, scans, and poses
 *    - Mobile Scroll Tracking: Glances in the direction of user scroll swipes
 *    - Focus: Attentive downward glance (+3.0px) toward input field
 *    - Paste Nod: Quick 250ms acknowledgment dip on URL receipt
 *    - Sleeping: Half-lidded resting state after 25s mouse inactivity; wakes with double blink
 *    - Extracting: Sharp horizontal scan slits (--) with rhythmic telemetry sweep
 *    - Success: Tall alert celebration bars (||) with balanced flat ceiling
 *    - Error: Inquisitive slant with asymmetric confused squint
 *    - Click: Playful one-eye wink easter egg
 */
export function Oxi({
  status = 'idle',
  size = 36,
  interactive = true,
  roofTilt = 'auto',
  isFocused = false,
  nodSignal = 0,
  className = '',
  ariaLabel = 'Oxi - Oxiv Mascot',
  onClick
}: OxiProps) {
  const rawId = useId();
  const clipId = `oxi-opening-clip-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [gazeOffset, setGazeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [normalizedX, setNormalizedX] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [microWander, setMicroWander] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scanOffset, setScanOffset] = useState(0);

  // Inactivity Sleep Mode (25s idle threshold)
  const [isSleeping, setIsSleeping] = useState(false);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSleepingRef = useRef(false);
  isSleepingRef.current = isSleeping;

  // Paste / Action Perk-up Nod
  const [isNodding, setIsNodding] = useState(false);

  // Mobile / Autonomous Life State
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isAutonomousActive, setIsAutonomousActive] = useState(false);
  const [autoMoodIndex, setAutoMoodIndex] = useState(0);
  const [scrollGazeY, setScrollGazeY] = useState(0);

  // 1. Mobile & Touch Screen Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(isCoarse || hasTouch);
      if (isCoarse || hasTouch) {
        setIsAutonomousActive(true);
      }
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // 2. Autonomous Mood Cycle Sequencer (Runs on mobile or when cursor is idle)
  useEffect(() => {
    if (status !== 'idle' || isSleeping || (!isAutonomousActive && !isTouchDevice)) {
      return;
    }

    const currentMood = AUTO_MOODS[autoMoodIndex];
    const timer = setTimeout(() => {
      setAutoMoodIndex((prev) => (prev + 1) % AUTO_MOODS.length);
    }, currentMood.duration);

    return () => clearTimeout(timer);
  }, [status, isSleeping, isAutonomousActive, isTouchDevice, autoMoodIndex]);

  // 3. Mobile Scroll Motion Reactive Tracker (Glance up/down on swipe)
  useEffect(() => {
    if (!isTouchDevice || status !== 'idle' || isSleeping) return;

    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;

      if (Math.abs(delta) > 3) {
        setScrollGazeY(delta > 0 ? 2.6 : -2.2);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setScrollGazeY(0);
        }, 380);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isTouchDevice, status, isSleeping]);

  // 4. Trigger perk-up nod reaction on nodSignal change
  useEffect(() => {
    if (!nodSignal) return;
    setIsNodding(true);
    const nodTimer = setTimeout(() => {
      setIsNodding(false);
    }, 250);
    return () => clearTimeout(nodTimer);
  }, [nodSignal]);

  // 5. Dynamic Roof Tilt Calculation (3-Way Morph)
  const dynamicTilt = React.useMemo<RoofTiltDirection>(() => {
    if (roofTilt !== 'auto') return roofTilt;

    // Platform lifecycle overrides when active
    if (status === 'extracting') return 'right';
    if (status === 'success') return 'flat';
    if (status === 'error') return 'left';

    // Sleep mode settles comfortably flat
    if (isSleeping) return 'flat';

    // When autonomous mode is active (on mobile or when cursor is stationary > 4s)
    if (isAutonomousActive || isTouchDevice) {
      return AUTO_MOODS[autoMoodIndex].tilt;
    }

    // In desktop mouse tracking mode: dynamically steer according to normalized horizontal gaze
    if (normalizedX > 0.22) return 'right';
    if (normalizedX < -0.22) return 'left';
    return 'flat';
  }, [roofTilt, status, normalizedX, isSleeping, isAutonomousActive, isTouchDevice, autoMoodIndex]);

  // 6. Global Mouse Gaze Tracking & Inactivity Sleep Watcher
  useEffect(() => {
    if (!interactive) return;

    let autoTimer: NodeJS.Timeout;

    const resetSleepTimer = () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }

      if (isSleepingRef.current) {
        // Wake up with an alert double-blink
        setIsSleeping(false);
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          setTimeout(() => {
            setIsBlinking(true);
            setTimeout(() => {
              setIsBlinking(false);
            }, 80);
          }, 70);
        }, 80);
      }

      // 25s Inactivity Timer
      sleepTimerRef.current = setTimeout(() => {
        if (status === 'idle') {
          setIsSleeping(true);
        }
      }, 25000);
    };

    resetSleepTimer();

    const handleGlobalMouseMove = (e: MouseEvent) => {
      resetSleepTimer();

      // Mouse is active -> pause autonomous mode and follow pointer directly
      if (!isTouchDevice) {
        setIsAutonomousActive(false);
        clearTimeout(autoTimer);
        // If cursor rests stationary for 4s, re-enable autonomous mood exploration
        autoTimer = setTimeout(() => {
          setIsAutonomousActive(true);
        }, 4000);
      }

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Half-window normalization (saturates smoothly toward screen edges)
      const halfWidth = Math.max(1, window.innerWidth / 2);
      const halfHeight = Math.max(1, window.innerHeight / 2);

      const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / halfWidth));
      const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / halfHeight));

      setNormalizedX(nx);

      // Clamped eye translation within interior mask bounds (max 5.5px horizontally, 4px vertically)
      setGazeOffset({
        x: nx * 5.5,
        y: ny * 4
      });
    };

    const handleWindowLeave = () => {
      setGazeOffset({ x: 0, y: 0 });
      setNormalizedX(0);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleWindowLeave);

    return () => {
      clearTimeout(autoTimer);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleWindowLeave);
    };
  }, [interactive, status, isTouchDevice]);

  // 7. Ambient Micro-Wander Drift (Subtle organic saccades)
  useEffect(() => {
    if (status !== 'idle' || !interactive || isSleeping) return;

    const interval = setInterval(() => {
      const driftX = (Math.random() - 0.5) * 2.2;
      const driftY = (Math.random() - 0.5) * 1.5;
      setMicroWander({ x: driftX, y: driftY });
    }, 2400);

    return () => clearInterval(interval);
  }, [status, interactive, isSleeping]);

  // 8. Biological Multi-Cadence Blinking (Double-blinks, single-blinks, soft-blinks)
  useEffect(() => {
    if (status !== 'idle' || isSleeping) return;

    let isCancelled = false;
    let timerId: NodeJS.Timeout;

    const executeBlinkSequence = () => {
      if (isCancelled) return;

      const roll = Math.random();

      if (roll < 0.65) {
        // Single natural blink (95ms)
        setIsBlinking(true);
        timerId = setTimeout(() => {
          if (isCancelled) return;
          setIsBlinking(false);
          scheduleNext(2400 + Math.random() * 2500);
        }, 95);
      } else if (roll < 0.93) {
        // Double-blink: blink 85ms -> reopen 70ms -> blink 85ms
        setIsBlinking(true);
        timerId = setTimeout(() => {
          if (isCancelled) return;
          setIsBlinking(false);
          timerId = setTimeout(() => {
            if (isCancelled) return;
            setIsBlinking(true);
            timerId = setTimeout(() => {
              if (isCancelled) return;
              setIsBlinking(false);
              scheduleNext(1800 + Math.random() * 2600);
            }, 85);
          }, 70);
        }, 85);
      } else {
        // Soft slow contemplation blink (140ms)
        setIsBlinking(true);
        timerId = setTimeout(() => {
          if (isCancelled) return;
          setIsBlinking(false);
          scheduleNext(3000 + Math.random() * 2000);
        }, 140);
      }
    };

    const scheduleNext = (delay: number) => {
      if (isCancelled) return;
      timerId = setTimeout(executeBlinkSequence, delay);
    };

    scheduleNext(1600 + Math.random() * 1600);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [status, isSleeping]);

  // 9. Extraction Saccade Scan Rhythm
  useEffect(() => {
    if (status !== 'extracting') {
      setScanOffset(0);
      return;
    }

    let animationFrameId: number;
    let startTime = performance.now();

    const animateScan = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const sweep = Math.sin(elapsed * Math.PI * 2.8) * 3.2;
      setScanOffset(sweep);
      animationFrameId = requestAnimationFrame(animateScan);
    };

    animationFrameId = requestAnimationFrame(animateScan);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  // 10. Interactive Click / Tap Wink Reaction (Easter Egg)
  const handleClick = useCallback(() => {
    if (onClick) onClick();
    if (isWinking) return;

    setIsWinking(true);
    // Advance autonomous mood when tapped
    if (isAutonomousActive || isTouchDevice) {
      setAutoMoodIndex((prev) => (prev + 1) % AUTO_MOODS.length);
    }
    setTimeout(() => {
      setIsWinking(false);
    }, 240);
  }, [onClick, isWinking, isAutonomousActive, isTouchDevice]);

  // 11. Dynamic Ceiling Coordinates (3-Way Morph)
  const ceilingY = React.useMemo(() => {
    if (dynamicTilt === 'left') {
      return { left: 36, right: 22 };
    }
    if (dynamicTilt === 'flat') {
      return { left: 26, right: 26 };
    }
    // tilt-right (signature slant)
    return { left: 22, right: 36 };
  }, [dynamicTilt]);

  // Unified Portal Frame Path
  const framePath = `M 12 92 L 12 10 L 88 10 L 88 92 L 74 92 L 74 ${ceilingY.right} L 26 ${ceilingY.left} L 26 92 Z`;

  // Interior opening clipping path
  const openingClipPath = `M 26 94 L 26 ${ceilingY.left} L 74 ${ceilingY.right} L 74 94 Z`;

  // 12. Expression & Eye Shape Geometry
  const eyeConfig = React.useMemo(() => {
    const baseX = 50;
    const baseY = 52;

    if (status === 'extracting') {
      return {
        width: 9.5,
        height: isBlinking ? 1 : 3.8,
        gap: 4,
        baseX: baseX + scanOffset,
        baseY,
        radius: 0.5,
        leftHeight: isBlinking ? 1 : 3.8,
        rightHeight: isBlinking ? 1 : 3.8
      };
    }

    if (status === 'success') {
      return {
        width: 5.5,
        height: isBlinking ? 1 : 14,
        gap: 4.5,
        baseX,
        baseY: baseY - 1,
        radius: 0.8,
        leftHeight: isBlinking ? 1 : 14,
        rightHeight: isBlinking ? 1 : 14
      };
    }

    if (status === 'error') {
      return {
        width: 7.5,
        height: 6,
        gap: 4,
        baseX: baseX - 2,
        baseY: baseY + 1,
        radius: 0.5,
        leftHeight: isBlinking ? 1 : 6.5,
        rightHeight: isBlinking ? 1 : 3.2 // Asymmetric squint
      };
    }

    // Sleep Mode: Restful half-lidded slits
    if (isSleeping) {
      return {
        width: 7.5,
        height: 1.8,
        gap: 4,
        baseX: baseX + 1.5,
        baseY: baseY + 2,
        radius: 0.5,
        leftHeight: 1.8,
        rightHeight: 1.8
      };
    }

    // Autonomous Mode (Mobile / stationary cursor exploration)
    if (status === 'idle' && !isFocused && (isAutonomousActive || isTouchDevice)) {
      const currentMood = AUTO_MOODS[autoMoodIndex];
      const customScale = currentMood.eyeScale;
      const baseHeight = isBlinking ? 1 : (customScale?.leftH ?? 5);
      const rightBaseHeight = isBlinking ? 1 : isWinking ? 1 : (customScale?.rightH ?? 5);
      const customWidth = customScale?.w ?? 7.5;

      return {
        width: customWidth,
        height: baseHeight,
        gap: 4,
        baseX: baseX + 1.5,
        baseY,
        radius: 0.5,
        leftHeight: baseHeight,
        rightHeight: rightBaseHeight
      };
    }

    // Default Idle Desktop tracking (with attentive focus and wink support)
    const normalHeight = isBlinking ? 1 : isFocused ? 5.6 : 5;
    return {
      width: 7.5,
      height: normalHeight,
      gap: 4,
      baseX: baseX + 1.5,
      baseY,
      radius: 0.5,
      leftHeight: normalHeight,
      rightHeight: isWinking ? 1 : normalHeight
    };
  }, [
    status,
    isBlinking,
    isWinking,
    scanOffset,
    isSleeping,
    isFocused,
    isAutonomousActive,
    isTouchDevice,
    autoMoodIndex
  ]);

  // Combined Eye Coordinates
  const focusOffsetY = isFocused && status === 'idle' && !isSleeping ? 3.0 : 0;
  const nodOffsetY = isNodding ? 2.4 : 0;

  // Autonomous gaze offsets from mood cycle
  const autoGaze =
    (isAutonomousActive || isTouchDevice) && status === 'idle' && !isSleeping && !isFocused
      ? AUTO_MOODS[autoMoodIndex].gaze
      : { x: 0, y: 0 };

  const rawGazeX =
    (isAutonomousActive || isTouchDevice ? autoGaze.x : gazeOffset.x) +
    (status === 'idle' && !isSleeping ? microWander.x : 0);

  const rawGazeY =
    (isSleeping
      ? 1.5
      : isAutonomousActive || isTouchDevice
      ? autoGaze.y
      : gazeOffset.y) +
    (status === 'idle' && !isSleeping ? microWander.y : 0) +
    focusOffsetY +
    nodOffsetY +
    scrollGazeY;

  // Clamp effective gaze coordinates safely within interior opening
  const effectiveGazeX = Math.max(-5.5, Math.min(5.5, rawGazeX));
  const effectiveGazeY = Math.max(-4.5, Math.min(5.5, rawGazeY));

  const leftEyeY = eyeConfig.baseY + effectiveGazeY - eyeConfig.leftHeight / 2;
  const leftEyeX =
    eyeConfig.baseX + effectiveGazeX - eyeConfig.gap / 2 - eyeConfig.width;

  const rightEyeBaseY =
    status === 'error' ? eyeConfig.baseY - 2 : eyeConfig.baseY;
  const rightEyeY = rightEyeBaseY + effectiveGazeY - eyeConfig.rightHeight / 2;
  const rightEyeX = eyeConfig.baseX + effectiveGazeX + eyeConfig.gap / 2;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`inline-flex items-center justify-center select-none cursor-pointer transition-transform active:scale-95 duration-100 ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Inner opening clip path to naturally clip gaze at pillars and slanted roof */}
          <clipPath id={clipId}>
            <path d={openingClipPath} />
          </clipPath>
        </defs>

        {/* Unified Portal Frame with 3-way dynamic roof morphing */}
        <path
          d={framePath}
          className="fill-[var(--colors-ink)] transition-all duration-300 ease-out"
        />

        {/*
          The Eyes: Rendered directly inside the gateway opening.
          Uses clipPath so if eyes gaze toward the pillars or ceiling,
          they automatically and cleanly clip against the geometry.
        */}
        <g clipPath={`url(#${clipId})`}>
          {/* Left Eye */}
          <rect
            x={leftEyeX}
            y={leftEyeY}
            width={eyeConfig.width}
            height={eyeConfig.leftHeight}
            rx={eyeConfig.radius}
            className="fill-[var(--colors-ink)] transition-all duration-200 ease-out"
          />

          {/* Right Eye */}
          <rect
            x={rightEyeX}
            y={rightEyeY}
            width={eyeConfig.width}
            height={eyeConfig.rightHeight}
            rx={eyeConfig.radius}
            className="fill-[var(--colors-ink)] transition-all duration-200 ease-out"
          />
        </g>
      </svg>
    </div>
  );
}
