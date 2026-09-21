import { startQuest } from './quest.js';

document.addEventListener('DOMContentLoaded', function () {
    const fallingContainer = document.getElementById('falling-flower-container');
    const audioPlayer = document.getElementById('audioPlayer');
    const listenHint = document.getElementById('listen-hint');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lastFlowerTime = 0;
    const flowerInterval = prefersReducedMotion ? 4000 : 420;
    let atmosphereStarted = false;
    let songStarted = false;
    let listenFallbackArmed = false;

    function getBouquetBloom() {
        const scale = Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--bouquet-scale')
        ) || 0.46;
        const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight - (56 * vmin * scale)
        };
    }

    function animationLoop(timestamp) {
        if (!prefersReducedMotion && atmosphereStarted) {
            if (timestamp - lastFlowerTime > flowerInterval) {
                createFallingFlower();
                lastFlowerTime = timestamp;
            }
        }

        requestAnimationFrame(animationLoop);
    }

    function createFallingFlower() {
        if (!fallingContainer) return;
        const bloom = getBouquetBloom();
        const angle = (Math.random() * 150 - 75) * (Math.PI / 180);
        const distance = 160 + Math.random() * 280;
        const flowerWrapper = document.createElement('div');
        flowerWrapper.className = 'falling-flower-wrapper';
        flowerWrapper.style.setProperty('--origin-x', `${bloom.x}px`);
        flowerWrapper.style.setProperty('--origin-y', `${bloom.y}px`);
        flowerWrapper.style.setProperty('--end-x', `${bloom.x + Math.sin(angle) * distance}px`);
        flowerWrapper.style.setProperty('--end-y', `${bloom.y - Math.cos(angle) * distance * 0.28 + Math.random() * 240}px`);
        flowerWrapper.style.setProperty('--spin', `${Math.random() * 200 - 100}deg`);

        const flower = document.createElement('div');
        flower.className = 'falling-flower';
        const animDuration = Math.random() * 5 + 8;
        const size = Math.random() * 22 + 14;

        flowerWrapper.style.animationDuration = `${animDuration}s`;
        flower.style.width = `${size}px`;
        flower.style.height = `${size}px`;
        flower.style.opacity = String(Math.random() * 0.35 + 0.45);

        flowerWrapper.appendChild(flower);
        fallingContainer.appendChild(flowerWrapper);
        setTimeout(() => flowerWrapper.remove(), animDuration * 1000 + 400);
    }

    function startAtmosphere() {
        atmosphereStarted = true;
        if (prefersReducedMotion) return;
        for (let index = 0; index < 10; index += 1) {
            createFallingFlower();
        }
    }

    function hideListenHint() {
        if (listenHint) listenHint.hidden = true;
    }

    function showListenHint() {
        if (!listenHint) return;
        listenHint.hidden = false;
    }

    function armListenFallback() {
        if (listenFallbackArmed) return;
        listenFallbackArmed = true;
        showListenHint();
        const resume = () => {
            startSong();
        };
        listenHint?.addEventListener('click', resume, { once: true });
        document.body.addEventListener('pointerdown', resume, { once: true });
    }

    function unlockAudio() {
        if (!audioPlayer || audioPlayer.dataset.unlocking === 'true') return;
        audioPlayer.dataset.unlocking = 'true';
        audioPlayer.muted = true;
        audioPlayer.play().then(() => {
            audioPlayer.dataset.unlocked = 'true';
            if (songStarted) {
                audioPlayer.muted = false;
                return;
            }
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            audioPlayer.muted = false;
        }).catch(() => {
            audioPlayer.muted = false;
        });
    }

    async function startSong() {
        if (!audioPlayer || songStarted) return;
        try {
            audioPlayer.muted = false;
            audioPlayer.volume = 0.7;
            await audioPlayer.play();
            songStarted = true;
            hideListenHint();
        } catch {
            songStarted = false;
            armListenFallback();
        }
    }

    function initPoemAnimation() {
        const poemText = "Como un campo dorado al despertar,\n" +
        "este jardín se enciende al verte llegar.\n\n" +
        "Cada pétalo guarda un gracias sincero,\n" +
        "un rato de oro, un abrazo entero.\n" +
        "Gracias por estar. Aquí hay espacio.";

        const poemElement = document.getElementById('poem-text');
        let charIndex = 0;
        const typingSpeed = 80;

        function typeWriter() {
            if (!poemElement) return;
            if (charIndex < poemText.length) {
                poemElement.textContent += poemText.charAt(charIndex);
                charIndex += 1;
                setTimeout(typeWriter, typingSpeed);
            } else {
                poemElement.classList.add('typing-done');
            }
        }

        if (poemElement) {
            typeWriter();
        }
    }

    function thickenBouquet() {
        const bed = document.querySelector('.flowers');
        const source = bed?.querySelector('.flower--2');
        const glow = bed?.querySelector('.bouquet-glow');
        if (!bed || !source || !glow) return;
        [8, 9, 10].forEach((number) => {
            const clone = source.cloneNode(true);
            clone.className = `flower flower--${number}`;
            bed.insertBefore(clone, glow);
        });
    }

    function initStarManager() {
        const night = document.querySelector('.night');
        if (!night) return;
        const starCount = prefersReducedMotion ? 48 : 160;
        for (let index = 0; index < starCount; index += 1) {
            const star = document.createElement('div');
            const roll = Math.random();
            star.className = roll > 0.9 ? 'star star--gold' : roll > 0.78 ? 'star star--bright' : 'star';
            star.style.top = `${Math.random() * 78}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            night.appendChild(star);
        }
        if (prefersReducedMotion) return;
        for (let index = 0; index < 12; index += 1) {
            const fly = document.createElement('div');
            fly.className = 'firefly';
            fly.style.top = `${48 + Math.random() * 42}%`;
            fly.style.left = `${18 + Math.random() * 64}%`;
            fly.style.animationDelay = `${Math.random() * 8}s`;
            fly.style.animationDuration = `${7 + Math.random() * 6}s`;
            night.appendChild(fly);
        }
    }

    function initViewportManager() {
        const setVh = () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
    }

    function openGarden() {
        const stage = document.querySelector('.stage');
        const flowers = document.querySelector('.flowers');
        startSong();
        stage?.removeAttribute('inert');
        flowers?.removeAttribute('inert');
        initPoemAnimation();
        startAtmosphere();
        if (listenHint && !listenHint.hidden) {
            listenHint.focus();
        }
    }

    if (audioPlayer) {
        audioPlayer.volume = 0.7;
        audioPlayer.load();
    }

    thickenBouquet();
    initStarManager();
    initViewportManager();
    requestAnimationFrame(animationLoop);
    startQuest({
        prefersReducedMotion,
        onHold: unlockAudio,
        onFinished: openGarden
    });
});
