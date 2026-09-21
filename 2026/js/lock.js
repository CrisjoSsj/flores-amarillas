import { playMatch, playRetry, playScanDeep, startScanHum, stopScanHum, unlockSfx } from './sfx.js';

const SCAN_MS = 2200;
const MATCH_MS = 1400;
const CELEBRATE_MS = 1600;
const LEAVE_MS = 850;
const SCAN_MID_MS = 1100;
const RETRY_MS = 1300;
const PETAL_COUNT = 18;

const COPY = {
    idle: {
        title: 'Esto está bloqueado',
        status: 'Apoya el dedo y quédate un segundo.',
        hint: 'Mantén presionado el sensor'
    },
    scanning: {
        title: 'Leyendo tu huella',
        status: 'No sueltes. Esto toma un momento.',
        hint: 'Sigue presionando'
    },
    scanningDeep: {
        status: 'Comparando… ya casi.'
    },
    retry: {
        title: 'Aún no',
        status: 'Quédate un poco más, sin soltar.',
        hint: 'Otra vez, sin soltar'
    },
    match: {
        title: 'Listo',
        status: 'Ya te reconocí. Pasa.',
        hint: ''
    },
    celebrating: {
        title: 'Listo',
        status: 'Ahora, una sonrisa.',
        hint: ''
    }
};

function pulse(pattern) {
    if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
    }
}

function flashCopy(element) {
    element.classList.remove('is-fresh');
    void element.offsetWidth;
    element.classList.add('is-fresh');
}

function applyCopy(gate, titleEl, statusEl, hintEl, key) {
    const next = COPY[key];
    if (!next) return;
    if (next.title) {
        titleEl.textContent = next.title;
        flashCopy(titleEl);
    }
    if (next.status) {
        statusEl.textContent = next.status;
        flashCopy(statusEl);
    }
    if (Object.prototype.hasOwnProperty.call(next, 'hint')) {
        hintEl.textContent = next.hint;
    }
    gate.dataset.state = key === 'scanningDeep' ? 'scanning' : key;
}

function spawnBurst(burst) {
    burst.replaceChildren();
    for (let index = 0; index < PETAL_COUNT; index += 1) {
        const petal = document.createElement('span');
        petal.className = 'lock-burst__petal';
        petal.style.setProperty('--angle', `${(index / PETAL_COUNT) * 360}deg`);
        petal.style.setProperty('--delay', `${index * 28}ms`);
        burst.appendChild(petal);
    }
}

export function startLockGate({ onUnlocked, onComplete, onMatch, onHold, prefersReducedMotion }) {
    const done = onComplete || onUnlocked;
    const gate = document.getElementById('lock-gate');
    const pad = document.getElementById('lock-pad');
    const titleEl = document.getElementById('lock-title');
    const statusEl = document.getElementById('lock-status');
    const hintEl = document.getElementById('lock-hint');
    const burst = document.getElementById('lock-burst');

    if (!gate || !pad || !titleEl || !statusEl || !hintEl) {
        onMatch?.();
        done();
        return;
    }

    let phase = 'idle';
    let isHolding = false;
    let activePointerId = null;
    let scanTimer = 0;
    let midTimer = 0;
    let retryTimer = 0;

    const clearScanTimers = () => {
        window.clearTimeout(scanTimer);
        window.clearTimeout(midTimer);
    };

    const setPhase = (next) => {
        phase = next;
        applyCopy(gate, titleEl, statusEl, hintEl, next);
        pad.setAttribute('aria-busy', next === 'scanning' ? 'true' : 'false');
    };

    const finishUnlock = () => {
        gate.classList.add('is-leaving');
        window.setTimeout(() => {
            gate.remove();
            done();
        }, prefersReducedMotion ? 0 : LEAVE_MS);
    };

    const celebrate = () => {
        setPhase('celebrating');
        if (burst && !prefersReducedMotion) {
            spawnBurst(burst);
        }
        window.setTimeout(finishUnlock, prefersReducedMotion ? 0 : CELEBRATE_MS);
    };

    const acceptPrint = () => {
        if (phase !== 'scanning' && phase !== 'idle') return;
        isHolding = false;
        activePointerId = null;
        clearScanTimers();
        stopScanHum();
        setPhase('match');
        onMatch?.();
        playMatch();
        pulse([18, 40, 28]);
        window.setTimeout(celebrate, prefersReducedMotion ? 0 : MATCH_MS);
    };

    const startScan = (pointerId) => {
        if (phase !== 'idle' && phase !== 'retry') return;
        isHolding = true;
        activePointerId = pointerId;
        window.clearTimeout(retryTimer);
        setPhase('scanning');
        onHold?.();
        unlockSfx();
        pulse(12);

        if (prefersReducedMotion) {
            acceptPrint();
            return;
        }

        startScanHum('print');
        midTimer = window.setTimeout(() => {
            if (phase === 'scanning') {
                applyCopy(gate, titleEl, statusEl, hintEl, 'scanningDeep');
                playScanDeep();
            }
        }, SCAN_MID_MS);

        scanTimer = window.setTimeout(acceptPrint, SCAN_MS);
    };

    const cancelScan = (pointerId) => {
        if (pointerId !== undefined && pointerId !== activePointerId) return;
        if (!isHolding || phase !== 'scanning') {
            isHolding = false;
            return;
        }
        isHolding = false;
        activePointerId = null;
        clearScanTimers();
        stopScanHum();
        playRetry();
        setPhase('retry');
        retryTimer = window.setTimeout(() => {
            if (phase === 'retry') setPhase('idle');
        }, RETRY_MS);
    };

    pad.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        try {
            pad.setPointerCapture(event.pointerId);
        } catch {
            // Synthetic events in tests have no real pointer capture.
        }
        startScan(event.pointerId);
    });

    pad.addEventListener('pointerup', (event) => {
        cancelScan(event.pointerId);
    });
    pad.addEventListener('pointercancel', (event) => {
        cancelScan(event.pointerId);
    });

    pad.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        if (!isHolding) startScan('keyboard');
    });

    pad.addEventListener('keyup', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        cancelScan('keyboard');
    });

    pad.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    pad.focus();
}
