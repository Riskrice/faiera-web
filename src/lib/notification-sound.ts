let sharedAudioContext: AudioContext | null = null;
let unlockListenersAttached = false;

function getAudioContextCtor(): typeof AudioContext | undefined {
    if (typeof window === 'undefined') return undefined;

    return (
        window.AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );
}

function ensureAudioContext(): AudioContext | null {
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
}

export function initNotificationSound(): void {
    if (typeof window === 'undefined' || unlockListenersAttached) return;

    unlockListenersAttached = true;

    const unlockOnce = () => {
        unlockAudioContext().catch(() => undefined);
    };

    window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    window.addEventListener('touchstart', unlockOnce, { once: true, passive: true });
    window.addEventListener('keydown', unlockOnce, { once: true });
}

export function playNotificationSound(): void {
    if (typeof window === 'undefined') return;

    initNotificationSound();

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

    if (context.state === 'suspended') {
        context.resume().then(() => {
            if (context.state === 'running') {
                emitTone();
            }
        }).catch(() => undefined);
        return;
    }

    if (context.state === 'running') {
        emitTone();
    }
}
