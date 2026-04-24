let sharedAudioContext: AudioContext | null = null;
let unlockListenersAttached = false;
let hasUserInteraction = false;
let isAudioUnlocked = false;

function hasTransientUserActivation(): boolean {
    if (typeof navigator === 'undefined') return true;

    const navWithActivation = navigator as Navigator & {
        userActivation?: {
            isActive?: boolean;
        };
    };

    // Older browsers may not expose userActivation.
    if (!navWithActivation.userActivation) return true;

    return navWithActivation.userActivation.isActive !== false;
}

function getAudioContextCtor(): typeof AudioContext | undefined {
    if (typeof window === 'undefined') return undefined;

    return (
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );
}

function ensureAudioContext(): AudioContext | null {
    if (!hasUserInteraction) return null;

    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) return null;

    if (!sharedAudioContext) {
        sharedAudioContext = new AudioContextCtor();
    }

    return sharedAudioContext;
}

async function unlockAudioContext(): Promise<void> {
    const context = ensureAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
        await context.resume().catch(() => undefined);
    }

    isAudioUnlocked = context.state === 'running';
}

export function initNotificationSound(): void {
    if (typeof window === 'undefined' || unlockListenersAttached) return;

    unlockListenersAttached = true;

    const unlockOnce = async (event: Event) => {
        // Ignore synthetic events and only unlock during active user gestures.
        if (!event.isTrusted || !hasTransientUserActivation()) {
            unlockListenersAttached = false;
            initNotificationSound();
            return;
        }

        hasUserInteraction = true;
        await unlockAudioContext().catch(() => undefined);

        // If browser still blocks audio unlock, keep trying on next user gesture.
        if (!isAudioUnlocked) {
            hasUserInteraction = false;
            unlockListenersAttached = false;
            initNotificationSound();
        }
    };

    window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    window.addEventListener('touchstart', unlockOnce, { once: true, passive: true });
    window.addEventListener('keydown', unlockOnce, { once: true });
}

export function playNotificationSound(): void {
    if (typeof window === 'undefined') return;

    initNotificationSound();

    // Browsers block Web Audio until a real user gesture occurs.
    if (!hasUserInteraction || !isAudioUnlocked) return;

    const context = ensureAudioContext();
    if (!context) return;

    const emitTone = () => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.16);

        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.18);
    };

    if (context.state === 'running') {
        emitTone();
    }
}
