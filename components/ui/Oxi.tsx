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
  | 'look-right-corner'
  | 'look-down'
  | 'look-left-corner'
  | 'ponder'
  | 'squint-scan'
  | 'alert';

interface AutoMoodConfig {
  mood: MobileMood;
  duration: number;
  tilt: RoofTiltDirection;
  gaze: { x: number; y: number };
  nx: number;
  ny: number;
  eyeScale?: { leftH?: number; rightH?: number; w?: number; radius?: number };
}

/**
 * Autonomous exploratory mood routine for mobile touchscreens and stationary cursor states.
 * Cycles dynamically through diverse roof tilts, corner hugs, deep downward glances, and varying eye sizes.
 */
const AUTO_MOODS: AutoMoodConfig[] = [
  { mood: 'center', duration: 3000, tilt: 'flat', gaze: { x: 0, y: 0 }, nx: 0, ny: 0 },
  {
    mood: 'look-right-corner',
    duration: 3500,
    tilt: 'right',
    gaze: { x: 12.5, y: 16.0 },
    nx: 0.95,
    ny: 0.6,
    eyeScale: { leftH: 5.2, rightH: 7.2, w: 8.5, radius: 0.8 }
  },
  {
    mood: 'look-down',
    duration: 3000,
    tilt: 'flat',
    gaze: { x: 0, y: 24.0 },
    nx: 0,
    ny: 1.0,
    eyeScale: { leftH: 4.2, rightH: 4.2, w: 9.2, radius: 0.5 }
  },
  {
    mood: 'look-left-corner',
    duration: 3500,
    tilt: 'left',
    gaze: { x: -12.5, y: 16.0 },
    nx: -0.95,
    ny: 0.6,
    eyeScale: { leftH: 7.2, rightH: 5.2, w: 8.5, radius: 0.8 }
  },
  {
    mood: 'ponder',
    duration: 3200,
    tilt: 'flat',
    gaze: { x: 5.0, y: -6.5 },
    nx: 0.4,
    ny: -0.6,
    eyeScale: { leftH: 6.5, rightH: 6.5, w: 7.5, radius: 1.0 }
  },
  {
    mood: 'squint-scan',
    duration: 2600,
    tilt: 'right',
    gaze: { x: -6.0, y: 8.0 },
    nx: -0.5,
    ny: 0.4,
    eyeScale: { leftH: 3.2, rightH: 3.2, w: 9.8, radius: 0.5 }
  },
  {
    mood: 'alert',
    duration: 2400,
    tilt: 'flat',
    gaze: { x: 0, y: -2.0 },
    nx: 0,
    ny: -0.2,
    eyeScale: { leftH: 8.2, rightH: 8.2, w: 8.8, radius: 1.4 }
  }
];

/**
 * Oxi — Oxiv's official interactive geometric mascot & brandmark.
 *
 * Kinematics & Expression Architecture:
 * 1. Deep Vertical Range & Corner Hugging:
 *    - Downward travel: plunges up to +26px deep into the lower portal zone
 *    - Corner hugs: reaches ±12.5px hugging the interior pillars
 *    - Parallelogram skew: slants (// and \\) to peek directly out of corners ("مراقبك")
 * 2. Dynamic Brow/Roof Descending:
 *    - As cursor points downwards, the roof brow dips down (up to +18px) to narrow the opening
 * 3. 3-Way Dynamic Roof Morphing:
 *    - tilt-right (Left peak 22, Right peak 36) -> cursor right, look-right mood, extracting
 *    - tilt-left  (Left peak 36, Right peak 22) -> cursor left, look-left mood, error
 *    - flat       (Left peak 26, Right peak 26) -> cursor center, look-down/ponder, sleeping, success
 * 4. Interactive Click "Wake-up Head Shake" Easter Egg:
 *    - On tap/click: rapidly shakes head/roof left-right-left-right, eyes dart in sync, finishes with alert double blink!
 * 5. Multi-Cadence Biological Blinking:
 *    - Realistic distribution: ~65% single blinks, ~28% rapid double blinks, ~7% soft languid blinks
 * 6. Pointer Priority:
 *    - Mouse/touch movements immediately and unconditionally drive the eyes
 *    - Autonomous exploration only engages after 5.5s of complete stillness
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
  const [normalizedY, setNormalizedY] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [microWander, setMicroWander] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scanOffset, setScanOffset] = useState(0);

  // Click / Tap "Wake-up Shake" State Machine (-1 = idle, 0..5 = active phases)
  const [shakePhase, setShakePhase] = useState<number>(-1);
  const shakeTimersRef = useRef<NodeJS.Timeout[]>([]);

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

  // Pointer Activity Timestamp (Ensures mouse movement ALWAYS overrides autonomous mode)
  const lastMoveTimestampRef = useRef<number>(0);
  const [isCurrentlyMovingPointer, setIsCurrentlyMovingPointer] = useState(false);

  // 1. Mobile & Touch Screen Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(isCoarse || hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // 2. Autonomous Mood Cycle Sequencer (Only runs when pointer is truly inactive and not shaking)
  useEffect(() => {
    if (status !== 'idle' || isSleeping || isCurrentlyMovingPointer || shakePhase >= 0) {
      return;
    }

    const currentMood = AUTO_MOODS[autoMoodIndex];
    const timer = setTimeout(() => {
      setAutoMoodIndex((prev) => (prev + 1) % AUTO_MOODS.length);
    }, currentMood.duration);

    return () => clearTimeout(timer);
  }, [status, isSleeping, isCurrentlyMovingPointer, shakePhase, autoMoodIndex]);

  // 3. Mobile Scroll Motion Reactive Tracker (Glance up/down on swipe)
  useEffect(() => {
    if (!isTouchDevice || status !== 'idle' || isSleeping || shakePhase >= 0) return;

    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;

      if (Math.abs(delta) > 3) {
        setScrollGazeY(delta > 0 ? 4.0 : -3.5);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setScrollGazeY(0);
        }, 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isTouchDevice, status, isSleeping, shakePhase]);

  // 4. Trigger perk-up nod reaction on nodSignal change
  useEffect(() => {
    if (!nodSignal) return;
    setIsNodding(true);
    const nodTimer = setTimeout(() => {
      setIsNodding(false);
    }, 250);
    return () => clearTimeout(nodTimer);
  }, [nodSignal]);

  // Determine whether autonomous cycle should apply
  const activeAutonomous =
    shakePhase < 0 &&
    !isCurrentlyMovingPointer &&
    (isAutonomousActive || isTouchDevice) &&
    status === 'idle' &&
    !isSleeping &&
    !isFocused;

  const currentNx = activeAutonomous ? AUTO_MOODS[autoMoodIndex].nx : normalizedX;
  const currentNy = activeAutonomous ? AUTO_MOODS[autoMoodIndex].ny : normalizedY;

  // 5. Dynamic Roof Tilt Calculation (3-Way Morph + Shake Choreography)
  const dynamicTilt = React.useMemo<RoofTiltDirection>(() => {
    // Interactive Click Shake takes instant priority
    if (shakePhase === 0 || shakePhase === 2) return 'left';
    if (shakePhase === 1 || shakePhase === 3) return 'right';
    if (shakePhase >= 4) return 'flat';

    if (roofTilt !== 'auto') return roofTilt;

    // Platform lifecycle overrides when active
    if (status === 'extracting') return 'right';
    if (status === 'success') return 'flat';
    if (status === 'error') return 'left';

    // Sleep mode settles comfortably flat
    if (isSleeping) return 'flat';

    // When autonomous mode is active
    if (activeAutonomous) {
      return AUTO_MOODS[autoMoodIndex].tilt;
    }

    // In desktop mouse tracking mode: dynamically steer according to normalized horizontal gaze
    if (normalizedX > 0.18) return 'right';
    if (normalizedX < -0.18) return 'left';
    return 'flat';
  }, [shakePhase, roofTilt, status, normalizedX, isSleeping, activeAutonomous, autoMoodIndex]);

  // Head-shake rotation angle in degrees
  const shakeRotation = React.useMemo(() => {
    if (shakePhase === 0) return -3.5;
    if (shakePhase === 1) return 3.5;
    if (shakePhase === 2) return -2.2;
    if (shakePhase === 3) return 2.2;
    return 0;
  }, [shakePhase]);

  // 6. Global Pointer (Mouse & Touch) Gaze Tracking with High Freedom Range
  useEffect(() => {
    if (!interactive) return;

    let autoTimer: NodeJS.Timeout;

    const resetSleepTimer = () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }

      if (isSleepingRef.current) {
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

    const updatePointerGaze = (clientX: number, clientY: number) => {
      resetSleepTimer();
      lastMoveTimestampRef.current = performance.now();
      setIsCurrentlyMovingPointer(true);

      // Reset stillness timer: only go into autonomous mode after 5.5s of no pointer movement
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        setIsCurrentlyMovingPointer(false);
        setIsAutonomousActive(true);
      }, 5500);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const halfWidth = Math.max(1, window.innerWidth / 2);
      const halfHeight = Math.max(1, window.innerHeight / 2);

      const nx = Math.max(-1, Math.min(1, (clientX - centerX) / halfWidth));
      const ny = Math.max(-1, Math.min(1, (clientY - centerY) / halfHeight));

      setNormalizedX(nx);
      setNormalizedY(ny);

      // High-freedom travel range:
      // Horizontally: ±12.5px (hugging the interior pillars!)
      // Vertically: Upwards -7.5px, Downwards +25px (plunging deep toward input/footer!)
      const targetGazeX = nx * 12.5;
      const targetGazeY = ny > 0 ? ny * 25.0 : ny * 7.5;

      setGazeOffset({
        x: targetGazeX,
        y: targetGazeY
      });
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      updatePointerGaze(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      updatePointerGaze(touch.clientX, touch.clientY);
    };

    const handleWindowLeave = () => {
      setGazeOffset({ x: 0, y: 0 });
      setNormalizedX(0);
      setNormalizedY(0);
      setIsCurrentlyMovingPointer(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchstart', handleGlobalTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleWindowLeave);

    return () => {
      clearTimeout(autoTimer);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchstart', handleGlobalTouchMove);
      document.removeEventListener('mouseleave', handleWindowLeave);
    };
  }, [interactive, status]);

  // 7. Ambient Micro-Wander Drift (Subtle organic saccades)
  useEffect(() => {
    if (status !== 'idle' || !interactive || isSleeping || shakePhase >= 0) return;

    const interval = setInterval(() => {
      const driftX = (Math.random() - 0.5) * 2.0;
      const driftY = (Math.random() - 0.5) * 1.5;
      setMicroWander({ x: driftX, y: driftY });
    }, 2400);

    return () => clearInterval(interval);
  }, [status, interactive, isSleeping, shakePhase]);

  // 8. Biological Multi-Cadence Blinking (Double-blinks, single-blinks, soft-blinks)
  useEffect(() => {
    if (status !== 'idle' || isSleeping || shakePhase >= 0) return;

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
  }, [status, isSleeping, shakePhase]);

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
      const sweep = Math.sin(elapsed * Math.PI * 2.8) * 3.5;
      setScanOffset(sweep);
      animationFrameId = requestAnimationFrame(animateScan);
    };

    animationFrameId = requestAnimationFrame(animateScan);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  // 10. Interactive Click / Tap "Wake-up Head Shake" Easter Egg
  const handleClick = useCallback(() => {
    if (onClick) onClick();
    if (shakePhase >= 0) return; // already in shake sequence

    // Clear any previous shake timers
    shakeTimersRef.current.forEach(clearTimeout);
    shakeTimersRef.current = [];

    if (isSleepingRef.current) {
      setIsSleeping(false);
    }

    // Step 0: Start shake left (0ms)
    setShakePhase(0);

    // Step 1: Swing right (140ms)
    shakeTimersRef.current.push(
      setTimeout(() => {
        setShakePhase(1);
      }, 140)
    );

    // Step 2: Swing left (280ms)
    shakeTimersRef.current.push(
      setTimeout(() => {
        setShakePhase(2);
      }, 280)
    );

    // Step 3: Swing right (420ms)
    shakeTimersRef.current.push(
      setTimeout(() => {
        setShakePhase(3);
      }, 420)
    );

    // Step 4: Center & alert first blink (560ms)
    shakeTimersRef.current.push(
      setTimeout(() => {
        setShakePhase(4);
        setIsBlinking(true);
        shakeTimersRef.current.push(
          setTimeout(() => {
            setIsBlinking(false);
          }, 70)
        );
      }, 560)
    );

    // Step 5: Second quick wake-up blink (670ms)
    shakeTimersRef.current.push(
      setTimeout(() => {
        setShakePhase(5);
        setIsBlinking(true);
        shakeTimersRef.current.push(
          setTimeout(() => {
            setIsBlinking(false);
          }, 65)
        );
      }, 670)
    );

    // Step 6: Complete & return to normal tracking (780ms)
    shakeTimersRef.current.push(
      setTimeout(() => {
        setShakePhase(-1);
      }, 780)
    );
  }, [onClick, shakePhase]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      shakeTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // 11. Dynamic Ceiling Coordinates (3-Way Morph + Downward Brow Descending Dip)
  const ceilingY = React.useMemo(() => {
    // When in click-shake mode, ceiling follows the energetic head shake
    if (shakePhase === 0 || shakePhase === 2) {
      return { left: 38, right: 20 };
    }
    if (shakePhase === 1 || shakePhase === 3) {
      return { left: 20, right: 38 };
    }
    if (shakePhase >= 4) {
      return { left: 26, right: 26 };
    }

    // When cursor is pointing downwards, the roof brow dips down noticeably into the frame
    // up to +18px when cursor is at the bottom of the viewport
    const dip = status === 'idle' && !isSleeping ? Math.max(0, currentNy) * 18 : 0;

    if (dynamicTilt === 'left') {
      return { left: 36 + dip * 1.15, right: 22 + dip * 0.75 };
    }
    if (dynamicTilt === 'flat') {
      return { left: 26 + dip, right: 26 + dip };
    }
    // tilt-right (signature slant)
    return { left: 22 + dip * 0.75, right: 36 + dip * 1.15 };
  }, [shakePhase, dynamicTilt, currentNy, status, isSleeping]);

  // Unified Portal Frame Path
  const framePath = `M 12 92 L 12 10 L 88 10 L 88 92 L 74 92 L 74 ${ceilingY.right} L 26 ${ceilingY.left} L 26 92 Z`;

  // Interior opening clipping path
  const openingClipPath = `M 26 94 L 26 ${ceilingY.left} L 74 ${ceilingY.right} L 74 94 Z`;

  // Combined Raw Gaze Offsets
  const focusOffsetY = isFocused && status === 'idle' && !isSleeping && shakePhase < 0 ? 6.0 : 0;
  const nodOffsetY = isNodding ? 3.5 : 0;

  // Shake gaze displacement
  const shakeGaze = React.useMemo(() => {
    if (shakePhase === 0) return { x: -12.0, y: -1.0 };
    if (shakePhase === 1) return { x: 12.0, y: -1.0 };
    if (shakePhase === 2) return { x: -8.5, y: 0 };
    if (shakePhase === 3) return { x: 8.5, y: 0 };
    if (shakePhase >= 4) return { x: 0, y: 0 };
    return null;
  }, [shakePhase]);

  const autoGaze = activeAutonomous ? AUTO_MOODS[autoMoodIndex].gaze : { x: 0, y: 0 };

  const rawGazeX =
    (shakeGaze !== null
      ? shakeGaze.x
      : activeAutonomous
      ? autoGaze.x
      : gazeOffset.x) + (status === 'idle' && !isSleeping && shakePhase < 0 ? microWander.x : 0);

  const rawGazeY =
    (shakeGaze !== null
      ? shakeGaze.y
      : isSleeping
      ? 2.0
      : activeAutonomous
      ? autoGaze.y
      : gazeOffset.y) +
    (status === 'idle' && !isSleeping && shakePhase < 0 ? microWander.y : 0) +
    focusOffsetY +
    nodOffsetY +
    scrollGazeY;

  // Clamp effective gaze coordinates with deep vertical freedom (+26px)
  const effectiveGazeX = Math.max(-13, Math.min(13, rawGazeX));
  const effectiveGazeY = Math.max(-8.5, Math.min(27, rawGazeY));

  // Parallelogram Skew Angle for watchful corner gaze or energetic head shake
  const skewAngle = React.useMemo(() => {
    if (shakePhase === 0 || shakePhase === 2) return 18;
    if (shakePhase === 1 || shakePhase === 3) return -18;
    if (shakePhase >= 4) return 0;

    if (status === 'idle' && !isSleeping) {
      return Math.max(-20, Math.min(20, -currentNx * 18));
    }
    return 0;
  }, [shakePhase, status, isSleeping, currentNx]);

  // 12. Dynamic Expression & Eye Shape Geometry (Shape scaling based on gaze & moods)
  const eyeConfig = React.useMemo(() => {
    const baseX = 50;
    const baseY = 46; // Base position allowing deep downward plunge

    // Click shake: wide alert startled eyes
    if (shakePhase >= 0 && shakePhase < 4) {
      return {
        width: 8.5,
        height: isBlinking ? 1 : 7.2,
        gap: 4,
        baseX: baseX + 1.5,
        baseY,
        radius: 1.0,
        leftHeight: isBlinking ? 1 : 7.2,
        rightHeight: isBlinking ? 1 : 7.2
      };
    }

    if (status === 'extracting') {
      return {
        width: 9.5,
        height: isBlinking ? 1 : 3.8,
        gap: 4,
        baseX: baseX + scanOffset,
        baseY: baseY + 4,
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
        baseY: baseY + 3,
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
        baseY: baseY + 4,
        radius: 0.5,
        leftHeight: isBlinking ? 1 : 6.5,
        rightHeight: isBlinking ? 1 : 3.2 // Asymmetric squint
      };
    }

    // Sleep Mode: Restful half-lidded slits
    if (isSleeping) {
      return {
        width: 7.8,
        height: 1.8,
        gap: 4,
        baseX: baseX + 1.5,
        baseY: baseY + 6,
        radius: 0.5,
        leftHeight: 1.8,
        rightHeight: 1.8
      };
    }

    // Autonomous Mode (Mobile / stationary cursor exploration)
    if (activeAutonomous) {
      const currentMood = AUTO_MOODS[autoMoodIndex];
      const customScale = currentMood.eyeScale;
      const baseHeight = isBlinking ? 1 : (customScale?.leftH ?? 5.2);
      const rightBaseHeight = isBlinking ? 1 : (customScale?.rightH ?? 5.2);
      const customWidth = customScale?.w ?? 8.0;
      const customRadius = customScale?.radius ?? 0.6;

      return {
        width: customWidth,
        height: baseHeight,
        gap: 4,
        baseX: baseX + 1.5,
        baseY,
        radius: customRadius,
        leftHeight: baseHeight,
        rightHeight: rightBaseHeight
      };
    }

    // Dynamic Idle Tracking: Animate eye size & shape based on gaze direction!
    let dynamicW = 7.8;
    let dynamicLeftH = 5.2;
    let dynamicRightH = 5.2;
    let dynamicR = 0.6;

    // Looking downwards: Eyelids compress into sleek, wider slits
    if (effectiveGazeY > 6) {
      const downFactor = Math.min(1, (effectiveGazeY - 6) / 18);
      dynamicW = 7.8 + downFactor * 1.6; // widens to 9.4
      dynamicLeftH = 5.2 - downFactor * 1.4; // compresses to ~3.8
      dynamicRightH = 5.2 - downFactor * 1.4;
      dynamicR = 0.5;
    } else if (effectiveGazeY < -2) {
      // Looking upwards: Eyes dilate larger in curiosity
      const upFactor = Math.min(1, Math.abs(effectiveGazeY + 2) / 6);
      dynamicLeftH = 5.2 + upFactor * 2.5; // expands to ~7.7
      dynamicRightH = 5.2 + upFactor * 2.5;
      dynamicW = 7.8 + upFactor * 0.8;
      dynamicR = 1.2;
    }

    // Looking sideways: Natural perspective asymmetry
    if (effectiveGazeX > 4) {
      const sideFactor = Math.min(1, (effectiveGazeX - 4) / 8);
      dynamicRightH += sideFactor * 1.4;
      dynamicLeftH -= sideFactor * 0.5;
    } else if (effectiveGazeX < -4) {
      const sideFactor = Math.min(1, Math.abs(effectiveGazeX + 4) / 8);
      dynamicLeftH += sideFactor * 1.4;
      dynamicRightH -= sideFactor * 0.5;
    }

    const finalLeftH = isBlinking ? 1 : isFocused ? 5.8 : dynamicLeftH;
    const finalRightH = isBlinking ? 1 : isFocused ? 5.8 : dynamicRightH;

    return {
      width: dynamicW,
      height: finalLeftH,
      gap: 4,
      baseX: baseX + 1.5,
      baseY,
      radius: dynamicR,
      leftHeight: finalLeftH,
      rightHeight: finalRightH
    };
  }, [
    shakePhase,
    status,
    isBlinking,
    scanOffset,
    isSleeping,
    isFocused,
    activeAutonomous,
    autoMoodIndex,
    effectiveGazeX,
    effectiveGazeY
  ]);

  const leftEyeY = eyeConfig.baseY + effectiveGazeY - eyeConfig.leftHeight / 2;
  const leftEyeX =
    eyeConfig.baseX + effectiveGazeX - eyeConfig.gap / 2 - eyeConfig.width;

  const rightEyeBaseY =
    status === 'error' ? eyeConfig.baseY - 2 : eyeConfig.baseY;
  const rightEyeY = rightEyeBaseY + effectiveGazeY - eyeConfig.rightHeight / 2;
  const rightEyeX = eyeConfig.baseX + effectiveGazeX + eyeConfig.gap / 2;

  // Centers for accurate SVG local skew transformation
  const leftEyeCenterX = leftEyeX + eyeConfig.width / 2;
  const leftEyeCenterY = leftEyeY + eyeConfig.leftHeight / 2;
  const rightEyeCenterX = rightEyeX + eyeConfig.width / 2;
  const rightEyeCenterY = rightEyeY + eyeConfig.rightHeight / 2;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-100 ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        transform: shakeRotation ? `rotate(${shakeRotation}deg)` : undefined
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

        {/* Unified Portal Frame with 3-way dynamic roof morphing + downward brow dip */}
        <path
          d={framePath}
          className="fill-[var(--colors-ink)] transition-all duration-150 ease-out"
        />

        {/*
          The Eyes: Rendered directly inside the gateway opening.
          Uses clipPath so if eyes gaze toward the pillars or ceiling,
          they automatically and cleanly clip against the geometry.
        */}
        <g clipPath={`url(#${clipId})`}>
          {/* Left Eye with local parallelogram corner skew */}
          <g
            transform={`translate(${leftEyeCenterX}, ${leftEyeCenterY}) skewX(${skewAngle}) translate(${-leftEyeCenterX}, ${-leftEyeCenterY})`}
            className="transition-transform duration-100 ease-out"
          >
            <rect
              x={leftEyeX}
              y={leftEyeY}
              width={eyeConfig.width}
              height={eyeConfig.leftHeight}
              rx={eyeConfig.radius}
              className="fill-[var(--colors-ink)] transition-all duration-100 ease-out"
            />
          </g>

          {/* Right Eye with local parallelogram corner skew */}
          <g
            transform={`translate(${rightEyeCenterX}, ${rightEyeCenterY}) skewX(${skewAngle}) translate(${-rightEyeCenterX}, ${-rightEyeCenterY})`}
            className="transition-transform duration-100 ease-out"
          >
            <rect
              x={rightEyeX}
              y={rightEyeY}
              width={eyeConfig.width}
              height={eyeConfig.rightHeight}
              rx={eyeConfig.radius}
              className="fill-[var(--colors-ink)] transition-all duration-100 ease-out"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
