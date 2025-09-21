// --- ROBUST CONSOLE & SHORTCUT BLOCKER ---
(function() {
    // Block right-click context menu
    document.addEventListener('contextmenu', event => event.preventDefault());

    // Block key combinations
    document.addEventListener('keydown', function(e) {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
            (e.ctrlKey && ['U', 'S'].includes(e.key.toUpperCase()))
        ) {
            e.preventDefault();
        }
    });

    // --- Aggressive DevTools blocking using a debugger loop ---
    const devToolsTrap = () => {
        debugger;
    };
    // Run the trap at a high frequency
    setInterval(devToolsTrap, 50);
})();


// --- MAIN APPLICATION LOGIC ---
document.addEventListener('DOMContentLoaded', function() {
    
    // Initial load animation
    setTimeout(() => {
        document.body.classList.remove("not-loaded");
    }, 1000);

    // --- ANIMATION OPTIMIZATION ---
    const particleContainer = document.getElementById('particle-container');
    const fallingContainer = document.getElementById('falling-flower-container');

    let lastParticleTime = 0;
    let lastFlowerTime = 0;
    const particleInterval = 100;
    const flowerInterval = 250;

    function animationLoop(timestamp) {
        if (timestamp - lastParticleTime > particleInterval) {
            createParticle(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
            createParticle((window.innerWidth / 2) + (Math.random() - 0.5) * 400, (window.innerHeight / 3) + (Math.random() - 0.5) * 300);
            lastParticleTime = timestamp;
        }

        if (timestamp - lastFlowerTime > flowerInterval) {
            createFallingFlower();
            lastFlowerTime = timestamp;
        }
        
        requestAnimationFrame(animationLoop);
    }

    function createParticle(x, y) {
        if (!particleContainer) return;
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 2;
        particle.style.cssText = `width: ${size}px; height: ${size}px; left: ${x}px; top: ${y}px; animation-delay: ${Math.random() * 6}s;`;
        particleContainer.appendChild(particle);
        setTimeout(() => particle.remove(), (6 + parseFloat(particle.style.animationDelay)) * 1000);
    }

    function createFallingFlower() {
        if (!fallingContainer) return;
        const flowerWrapper = document.createElement('div');
        flowerWrapper.className = 'falling-flower-wrapper';
        const flower = document.createElement('div');
        flower.className = 'falling-flower';
        
        const animDuration = Math.random() * 8 + 7;
        const size = Math.random() * 30 + 10;

        flowerWrapper.style.left = Math.random() * 95 + 'vw';
        flowerWrapper.style.animationDuration = animDuration + 's';
        
        flower.style.animationDuration = (Math.random() * 2 + 3) + 's';
        flower.style.width = size + 'px';
        flower.style.height = size + 'px';
        flower.style.filter = `blur(${Math.random() * 2}px)`;
        flower.style.opacity = Math.random() * 0.5 + 0.5;

        flowerWrapper.appendChild(flower);
        fallingContainer.appendChild(flowerWrapper);

        setTimeout(() => flowerWrapper.remove(), animDuration * 1000 + 500);
    }

    // Start the optimized animation loop
    requestAnimationFrame(animationLoop);

    // --- MUSIC PLAYER LOGIC ---
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    if (audioPlayer) {
        // Set default volume
        audioPlayer.volume = 0.7;
        
        const showPlayIcon = () => { 
            if (playIcon) playIcon.style.display = 'block'; 
            if (pauseIcon) pauseIcon.style.display = 'none'; 
        };
        const showPauseIcon = () => { 
            if (playIcon) playIcon.style.display = 'none'; 
            if (pauseIcon) pauseIcon.style.display = 'block'; 
        };

        const togglePlayPause = async () => {
            try {
                if (audioPlayer.paused) {
                    await audioPlayer.play();
                    console.log('Audio started playing');
                } else {
                    audioPlayer.pause();
                    console.log('Audio paused');
                }
            } catch (error) {
                console.error('Error playing audio:', error);
                // Reset to play icon if there's an error
                showPlayIcon();
            }
        };
        
        // Audio event listeners
        audioPlayer.addEventListener('play', () => {
            console.log('Audio play event fired');
            showPauseIcon();
        });
        
        audioPlayer.addEventListener('pause', () => {
            console.log('Audio pause event fired');
            showPlayIcon();
        });

        audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Error details:', audioPlayer.error);
        });

        audioPlayer.addEventListener('canplay', () => {
            console.log('Audio can start playing');
        });

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration && currentTimeEl && progressFill) {
                progressFill.style.width = `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%`;
                currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            }
        });
            
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (audioPlayer.duration && totalTimeEl) {
                totalTimeEl.textContent = formatTime(audioPlayer.duration);
                console.log('Audio metadata loaded, duration:', audioPlayer.duration);
            }
        });

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const newTime = ((e.clientX - rect.left) / rect.width) * audioPlayer.duration;
                audioPlayer.currentTime = newTime;
            });
        }
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }

        // Try to load the audio file
        audioPlayer.load();
        console.log('Audio player initialized, source:', audioPlayer.src);
    }

    // --- POEM ANIMATION ---
    function initPoemAnimation() {
        const poemText = "Como un campo dorado al despertar,\n" +
        "mi corazón florece al verte llegar.\n" +
        "Eres la brisa que en calma y me tranquiliza,\n" +
        "el sol eterno que nunca se pierde.\n\n" +
        "Cada pétalo guarda tu esencia querida,\n" +
        "como un jardín que me regala vida.\n" +
        "te amo con todo mi ser mi vida gracias por existir,\n"+
        "feliz dia de las flores amarillas mi amor y anivermes,\n"+
        "gracias por ser mi 20 de cada mes viki te amo mucho ❤️.";

        
        const poemElement = document.getElementById("poem-text");
        let charIndex = 0;
        const typingSpeed = 80;

        function typeWriter() {
            if (charIndex < poemText.length) {
                poemElement.innerHTML += poemText.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, typingSpeed);
            } else {
                poemElement.classList.add("typing-done");
            }
        }

        if (poemElement) {
            typeWriter();
        }
    }

    // --- STAR MANAGER ---
    function initStarManager() {
        const night = document.querySelector('.night');
        if (night) {
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 5}s`;
                night.appendChild(star);
            }
        }
    }

    // --- VIEWPORT MANAGER ---
    function initViewportManager() {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVh();
        window.addEventListener('resize', setVh);
    }

    // Initialize new modules
    initPoemAnimation();
    initStarManager();
    initViewportManager();
});
