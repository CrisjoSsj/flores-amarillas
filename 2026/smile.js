import { playMatch, playRetry, playShutter, startScanHum, stopScanHum, unlockSfx } from './sfx.js';

const HOLD_MS = 1800;
const LEAVE_MS = 850;
const READY_MS = 500;
const FRAME_SRC = 'smile-frame.png';
const HOLE = { top: 0.12, right: 0.115, bottom: 0.15, left: 0.115 };

function pulse(pattern) {
    if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
    }
}

function stopStream(stream) {
    stream?.getTracks().forEach((track) => track.stop());
}

function loadFrame() {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('frame'));
        image.src = FRAME_SRC;
    });
}

function drawFramedPhoto(photo, frame) {
    const card = document.createElement('canvas');
    card.width = frame.naturalWidth;
    card.height = frame.naturalHeight;
    const context = card.getContext('2d');
    if (!context) return card;
    const x = card.width * HOLE.left;
    const y = card.height * HOLE.top;
    const width = card.width * (1 - HOLE.left - HOLE.right);
    const height = card.height * (1 - HOLE.top - HOLE.bottom);
    context.save();
    context.beginPath();
    if (typeof context.roundRect === 'function') {
        context.roundRect(x, y, width, height, Math.min(width, height) * 0.07);
    } else {
        context.rect(x, y, width, height);
    }
    context.clip();
    context.translate(x + width, y);
    context.scale(-1, 1);
    context.drawImage(photo, 0, 0, width, height);
    context.restore();
    context.drawImage(frame, 0, 0, card.width, card.height);
    return card;
}

function downloadCard(card) {
    const link = document.createElement('a');
    link.href = card.toDataURL('image/png');
    link.download = 'sonrisa-flores.png';
    link.click();
}

function blobFromCard(card) {
    return new Promise((resolve) => {
        if (!card || typeof card.toBlob !== 'function') {
            resolve(null);
            return;
        }
        card.toBlob(resolve, 'image/png');
    });
}

async function fileFromCard(card) {
    const blob = await blobFromCard(card);
    if (!blob) return null;
    return new File([blob], 'sonrisa-flores.png', { type: 'image/png' });
}

async function shareCard(file, card) {
    if (typeof navigator.share !== 'function') {
        if (card) downloadCard(card);
        return 'saved';
    }
    if (file) {
        try {
            await navigator.share({
                files: [file],
                title: 'Te traje un jardín',
                text: 'Una sonrisa para este día.'
            });
            return 'shared';
        } catch (error) {
            if (error?.name === 'AbortError') throw error;
        }
    }
    await navigator.share({
        title: 'Te traje un jardín',
        text: 'Una sonrisa para este día.'
    });
    return 'shared';
}

export function startSmileGate({ onComplete, prefersReducedMotion }) {
    const gate = document.getElementById('smile-gate');
    const shutter = document.getElementById('smile-shutter');
    const video = document.getElementById('smile-video');
    const shot = document.getElementById('smile-shot');
    const statusEl = document.getElementById('smile-status');
    const face = document.getElementById('smile-face');
    const shareBox = document.getElementById('smile-share');
    const shareBtn = document.getElementById('smile-share-btn');
    const retakeBtn = document.getElementById('smile-retake-btn');
    const continueBtn = document.getElementById('smile-continue-btn');
    const shareCopy = document.getElementById('smile-share-copy');

    if (!gate || !shutter || !statusEl) {
        onComplete();
        return;
    }

    gate.hidden = false;
    gate.dataset.state = 'idle';
    shutter.focus();

    let stream = null;
    let isHolding = false;
    let holdTimer = 0;
    let accepted = false;
    let shareCardCanvas = null;
    let shareFile = null;
    let isSharing = false;

    const setStatus = (text) => {
        statusEl.textContent = text;
    };

    const leave = () => {
        gate.classList.add('is-leaving');
        window.setTimeout(() => {
            stopStream(stream);
            stream = null;
            if (video) video.srcObject = null;
            stopScanHum();
            gate.remove();
            onComplete();
        }, prefersReducedMotion ? 0 : LEAVE_MS);
    };

    const showSharePrompt = async () => {
        gate.dataset.state = 'ready';
        setStatus('Sonrisa escaneada.');
        if (shareBox) shareBox.hidden = false;
        continueBtn?.focus();
        if (!shot || shot.hidden) {
            if (shareBtn) shareBtn.hidden = true;
            return;
        }
        try {
            const frame = await loadFrame();
            shareCardCanvas = drawFramedPhoto(shot, frame);
        } catch {
            shareCardCanvas = shot;
        }
        shareFile = await fileFromCard(shareCardCanvas);
    };

    const acceptSmile = () => {
        if (accepted) return;
        accepted = true;
        isHolding = false;
        window.clearTimeout(holdTimer);
        gate.dataset.state = 'match';
        shutter.setAttribute('disabled', '');
        stopScanHum();
        playShutter();
        playMatch();
        pulse([18, 40, 28]);

        if (video && shot && stream) {
            shot.width = video.videoWidth || 480;
            shot.height = video.videoHeight || 480;
            const context = shot.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, shot.width, shot.height);
                shot.hidden = false;
                video.hidden = true;
            }
            stopStream(stream);
            stream = null;
            video.srcObject = null;
        }

        setStatus('Sonrisa escaneada.');
        window.setTimeout(showSharePrompt, prefersReducedMotion ? 0 : READY_MS);
    };

    const startHold = () => {
        if (accepted || isHolding) return;
        isHolding = true;
        gate.dataset.state = 'scanning';
        setStatus('Así. No te muevas…');
        unlockSfx();
        pulse(12);

        if (prefersReducedMotion) {
            acceptSmile();
            return;
        }

        startScanHum('smile');
        holdTimer = window.setTimeout(acceptSmile, HOLD_MS);
    };

    const cancelHold = () => {
        if (accepted || !isHolding) return;
        isHolding = false;
        window.clearTimeout(holdTimer);
        stopScanHum();
        playRetry();
        gate.dataset.state = 'idle';
        setStatus('Sonríe y mantén presionado');
    };

    const retakeSmile = () => {
        accepted = false;
        isHolding = false;
        shareCardCanvas = null;
        shareFile = null;
        window.clearTimeout(holdTimer);
        if (shareBox) shareBox.hidden = true;
        if (shareCopy) {
            shareCopy.textContent = 'Sonrisa escaneada. ¿La compartes… o seguimos?';
        }
        if (shareBtn) shareBtn.hidden = false;
        shutter.removeAttribute('disabled');
        if (shot) {
            const context = shot.getContext('2d');
            context?.clearRect(0, 0, shot.width, shot.height);
            shot.hidden = true;
        }
        gate.dataset.state = 'idle';
        setStatus('Sonríe y mantén presionado');
        openCamera().then(() => {
            shutter.focus();
        }).catch(() => {
            if (video) video.hidden = true;
            if (face) face.hidden = false;
            setStatus('Sonríe a la pantalla y mantén el botón');
            shutter.focus();
        });
    };

    const openCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia || !video) {
            throw new Error('no-camera');
        }
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }
        });
        video.srcObject = stream;
        video.hidden = false;
        if (face) face.hidden = true;
        await video.play();
        setStatus('Sonríe a la cámara y mantén el botón');
    };

    shutter.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        startHold();
    });
    shutter.addEventListener('pointerup', cancelHold);
    shutter.addEventListener('pointercancel', cancelHold);
    shutter.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        startHold();
    });
    shutter.addEventListener('keyup', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        cancelHold();
    });

    shareBtn?.addEventListener('click', async () => {
        if (isSharing) return;
        isSharing = true;
        try {
            const result = await shareCard(shareFile, shareCardCanvas || shot);
            if (shareCopy) {
                shareCopy.textContent = result === 'shared'
                    ? 'Listo. Cuando quieras, seguimos.'
                    : 'Quedó guardada. Compártela cuando quieras, o seguimos.';
            }
        } catch (error) {
            if (error?.name !== 'AbortError') {
                downloadCard(shareCardCanvas || shot);
                if (shareCopy) {
                    shareCopy.textContent = 'Quedó guardada. Compártela cuando quieras, o seguimos.';
                }
            }
        } finally {
            isSharing = false;
            continueBtn?.focus();
        }
    });

    retakeBtn?.addEventListener('click', retakeSmile);
    continueBtn?.addEventListener('click', leave);

    openCamera().catch(() => {
        stopStream(stream);
        stream = null;
        if (video) video.hidden = true;
        if (face) face.hidden = false;
        setStatus('Sonríe a la pantalla y mantén el botón');
    });
}
