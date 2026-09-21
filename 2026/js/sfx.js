let audioContext = null;
let scanHum = null;

function getContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    return audioContext;
}

export function unlockSfx() {
    getContext();
}

function playTone({ frequency, duration, type = 'sine', gain = 0.07, slide = 0 }) {
    const context = getContext();
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const amplifier = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slide !== 0) {
        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(40, frequency + slide),
            now + duration
        );
    }
    amplifier.gain.setValueAtTime(0.0001, now);
    amplifier.gain.exponentialRampToValueAtTime(gain, now + 0.02);
    amplifier.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(amplifier);
    amplifier.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
}

export function stopScanHum() {
    if (!scanHum) return;
    scanHum.stop();
    scanHum = null;
}

export function startScanHum(kind = 'print') {
    stopScanHum();
    const context = getContext();
    if (!context) return;

    const master = context.createGain();
    master.gain.value = 0.05;
    master.connect(context.destination);

    const hum = context.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = kind === 'smile' ? 196 : 156;
    const humGain = context.createGain();
    humGain.gain.value = 0.55;
    hum.connect(humGain);
    humGain.connect(master);
    hum.start();

    const sweep = context.createOscillator();
    sweep.type = 'triangle';
    sweep.frequency.value = kind === 'smile' ? 520 : 430;
    const sweepGain = context.createGain();
    sweepGain.gain.value = 0.0001;
    sweep.connect(sweepGain);
    sweepGain.connect(master);
    sweep.start();

    const pulse = () => {
        if (!scanHum) return;
        const now = context.currentTime;
        sweepGain.gain.cancelScheduledValues(now);
        sweepGain.gain.setValueAtTime(0.0001, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.32, now + 0.03);
        sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    };

    pulse();
    const tick = window.setInterval(pulse, kind === 'smile' ? 230 : 170);

    scanHum = {
        stop() {
            window.clearInterval(tick);
            const now = context.currentTime;
            master.gain.cancelScheduledValues(now);
            master.gain.setValueAtTime(master.gain.value, now);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
            hum.stop(now + 0.1);
            sweep.stop(now + 0.1);
        }
    };
}

export function playScanDeep() {
    playTone({ frequency: 740, duration: 0.14, type: 'sine', gain: 0.05, slide: 160 });
}

export function playMatch() {
    playTone({ frequency: 523.25, duration: 0.2, type: 'sine', gain: 0.07 });
    window.setTimeout(() => {
        playTone({ frequency: 783.99, duration: 0.38, type: 'sine', gain: 0.075 });
    }, 90);
}

export function playRetry() {
    playTone({ frequency: 196, duration: 0.2, type: 'triangle', gain: 0.045, slide: -70 });
}

export function playShutter() {
    playTone({ frequency: 980, duration: 0.07, type: 'square', gain: 0.03, slide: -220 });
}
