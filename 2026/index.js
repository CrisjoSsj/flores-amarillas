import { startLockGate } from './lock.js';

document.addEventListener('DOMContentLoaded', function () {
    const particleContainer = document.getElementById('particle-container');
    const fallingContainer = document.getElementById('falling-flower-container');
    const audioPlayer = document.getElementById('audioPlayer');
    const listenHint = document.getElementById('listen-hint');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lastParticleTime = 0;
    let lastFlowerTime = 0;
    const particleInterval = prefersReducedMotion ? 2400 : 280;
    const flowerInterval = prefersReducedMotion ? 4000 : 720;
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
            if (timestamp - lastParticleTime > particleInterval) {
                const bloom = getBouquetBloom();
                createParticle(
                    bloom.x + (Math.random() - 0.5) * 120,
                    bloom.y + (Math.random() - 0.5) * 50
                );
                createParticle(
                    bloom.x + (Math.random() - 0.5) * 80,
                    bloom.y + 18 + Math.random() * 28
                );
                lastParticleTime = timestamp;
            }

            if (timestamp - lastFlowerTime > flowerInterval) {
                createFallingFlower();
                lastFlowerTime = timestamp;
            }
        }

        requestAnimationFrame(animationLoop);
    }

    function createParticle(x, y) {
        if (!particleContainer) return;
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        particle.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;animation-delay:${Math.random() * 2}s;`;
        particleContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 9000);
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
        const size = Math.random() * 16 + 10;

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
        const poemText = "Te traje el sol en un ramo.\n" +
        "Cuando llegas, todo se abre.\n" +
        "Tú me calmas.\n" +
        "Tú no te me pierdes.\n\n" +
        "Cada pétalo es tuyo.\n" +
        "Gracias por estar.\n" +
        "Te amo.";

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

    function initStarManager() {
        const night = document.querySelector('.night');
        if (!night) return;
        const starCount = prefersReducedMotion ? 36 : 120;
        for (let index = 0; index < starCount; index += 1) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            if (Math.random() > 0.84) {
                star.style.width = '3px';
                star.style.height = '3px';
            }
            night.appendChild(star);
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

    initStarManager();
    initViewportManager();
    requestAnimationFrame(animationLoop);
    startLockGate({
        prefersReducedMotion,
        onHold: unlockAudio,
        onMatch: startSong,
        onUnlocked: openGarden
    });
});
