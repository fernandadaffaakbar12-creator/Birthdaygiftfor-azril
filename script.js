// ==========================================
// BACKGROUND AIR BERGELOMBANG SANTAI (WATER WAVE & CAUSTIC ENGINE)
// ==========================================
(function initWaterEffect() {
    function setupWater() {
        const canvas = document.getElementById('water-canvas');
        const turbulenceEl = document.getElementById('water-turbulence');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);

        let width = 0;
        let height = 0;
        let dpr = 1;
        let animationFrameId = null;
        let startTime = performance.now();
        let lastTime = startTime;

        // Kumpulan riak air interaktif (interaksi klik / sentuh)
        const ripples = [];
        const MAX_RIPPLES = isMobile ? 4 : 12;

        // Kumpulan kilauan cahaya matahari (water sparkles / glints)
        let sparkles = [];

        // Kumpulan kurva kaustik air bergelombang (flowing caustics ribbons)
        let waveRibbons = [];

        // Timer untuk riak tetesan air santai otomatis jika layar diam
        let lastInteractionTime = performance.now();
        let nextIdleDropTime = performance.now() + 3000;

        function resize() {
            // Pada HP, gunakan DPR 1 untuk mencegah pemborosan GPU dan overheating
            dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            generateWaveRibbons();
            generateSparkles();
        }

        // Membuat konfigurasi pita gelombang kaustik air santai
        function generateWaveRibbons() {
            waveRibbons = [];
            // Di HP kurangi jumlah pita agar render tetap super ringan
            const count = isMobile ? 4 : Math.min(Math.max(Math.floor(height / 85), 8), 16);
            for (let i = 0; i < count; i++) {
                waveRibbons.push({
                    baseY: (height / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 40,
                    amplitude: isMobile ? 6 + Math.random() * 8 : 8 + Math.random() * 12,
                    frequency: 0.003 + Math.random() * 0.003,
                    speed: 0.0006 + Math.random() * 0.0005,
                    phase: Math.random() * Math.PI * 2,
                    lineWidth: isMobile ? 1.0 + Math.random() * 1.2 : 1.2 + Math.random() * 1.8,
                    alpha: 0.12 + Math.random() * 0.14,
                    // Warna bias spektrum pelangi lembut
                    hueOffset: Math.random() * 30 - 15,
                    iridescent: i % 2 === 0
                });
            }
        }

        // Membuat kilauan pantulan cahaya matahari pada puncak gelombang
        function generateSparkles() {
            sparkles = [];
            // Di HP cukup 12 sparkles, di desktop 22-48
            const count = isMobile ? 12 : Math.min(Math.max(Math.floor((width * height) / 22000), 22), 48);
            for (let i = 0; i < count; i++) {
                sparkles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: 2.5 + Math.random() * 3.5,
                    alpha: 0,
                    maxAlpha: 0.45 + Math.random() * 0.4,
                    twinkleSpeed: 0.0012 + Math.random() * 0.002,
                    phase: Math.random() * Math.PI * 2,
                    rotation: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.004,
                    type: Math.random() < 0.35 ? 'iridescent' : 'pure'
                });
            }
        }

        // Menambahkan riak air lembut (ripple)
        function addRipple(x, y, strength = 1.0) {
            if (ripples.length >= MAX_RIPPLES) {
                ripples.shift();
            }
            ripples.push({
                x: x,
                y: y,
                radius: 2,
                maxRadius: Math.min(width, height) * (0.35 + Math.random() * 0.15) * strength,
                speed: 1.2 + Math.random() * 0.6,
                strength: strength,
                alpha: 0.75 * strength,
                width: 2.2 + Math.random() * 1.2
            });
            lastInteractionTime = performance.now();
        }

        // Listener interaksi sentuh / klik / gerak cursor
        let lastMove = 0;
        let lastClickTime = 0;
        function handlePointer(e) {
            const now = performance.now();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
            if (clientX === null || clientY === null) return;

            // Throttle lebih hemat di mobile (300ms) vs desktop (180ms)
            const throttleMs = isMobile ? 300 : 180;
            if (now - lastMove > throttleMs) {
                addRipple(clientX, clientY, 0.45);
                lastMove = now;
            }
        }

        function handleClick(e) {
            const now = performance.now();
            // Mencegah double trigger dari pointerdown + touchstart
            if (now - lastClickTime < 150) return;
            lastClickTime = now;

            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
            if (clientX === null || clientY === null) return;
            addRipple(clientX, clientY, 0.85);
        }

        if (window.PointerEvent) {
            window.addEventListener('pointermove', handlePointer, { passive: true });
            window.addEventListener('pointerdown', handleClick, { passive: true });
        } else {
            window.addEventListener('mousemove', handlePointer, { passive: true });
            window.addEventListener('touchstart', handleClick, { passive: true });
        }

        // Menggambar kilauan 4-point star kristal matahari di permukaan air
        function drawSparkle(x, y, size, alpha, rotation, isIridescent) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            let strokeColor = `rgba(255, 255, 255, ${alpha})`;
            let coreColor = `rgba(255, 255, 255, ${alpha * 0.9})`;
            if (isIridescent) {
                coreColor = `rgba(255, 220, 245, ${alpha * 0.85})`;
            }

            const len = size * 2.6;
            const w = size * 0.35;

            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.moveTo(0, -len);
            ctx.quadraticCurveTo(w, 0, 0, len);
            ctx.quadraticCurveTo(-w, 0, 0, -len);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-len, 0);
            ctx.quadraticCurveTo(0, w, len, 0);
            ctx.quadraticCurveTo(0, -w, -len, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = strokeColor;
            ctx.fill();

            ctx.restore();
        }

        // Elemen overlay layar penuh yang menutupi background
        const candlePageEl = document.getElementById('candle-page');
        const modalEl = document.getElementById('image-modal');
        let lastRenderTime = 0;
        const targetFpsInterval = isMobile ? 1000 / 45 : 0; // ~45 FPS di HP untuk penghematan daya & bebas jank

        // Render loop
        function render(time) {
            animationFrameId = requestAnimationFrame(render);

            // Jika lilin atau modal sedang tampil penuh di layar, hemat GPU dengan skip render background
            if ((candlePageEl && candlePageEl.classList.contains('active')) ||
                (modalEl && modalEl.classList.contains('show-modal'))) {
                return;
            }

            // Pacing frame rate di mobile agar GPU dingin dan scrolling tidak tersendat
            if (isMobile && targetFpsInterval > 0) {
                if (time - lastRenderTime < targetFpsInterval) {
                    return;
                }
            }
            const delta = time - (lastRenderTime || time);
            lastRenderTime = time;

            ctx.clearRect(0, 0, width, height);

            // 1. Gambar pita gelombang kaustik air (Flowing Sunlight Caustics Ribbons)
            const step = isMobile ? 36 : 20;
            for (let i = 0; i < waveRibbons.length; i++) {
                const w = waveRibbons[i];
                ctx.save();
                ctx.beginPath();

                const t = time * w.speed + w.phase;
                const waveGrad = ctx.createLinearGradient(0, w.baseY, width, w.baseY);

                if (w.iridescent) {
                    waveGrad.addColorStop(0, `rgba(200, 245, 255, 0)`);
                    waveGrad.addColorStop(0.3, `rgba(255, 225, 245, ${w.alpha * 0.8})`);
                    waveGrad.addColorStop(0.7, `rgba(180, 250, 245, ${w.alpha})`);
                    waveGrad.addColorStop(1, `rgba(220, 240, 255, 0)`);
                } else {
                    waveGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
                    waveGrad.addColorStop(0.5, `rgba(255, 255, 255, ${w.alpha})`);
                    waveGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
                }

                ctx.strokeStyle = waveGrad;
                ctx.lineWidth = w.lineWidth;
                ctx.lineCap = 'round';

                let started = false;
                for (let x = -20; x <= width + 20; x += step) {
                    const wave1 = Math.sin(x * w.frequency + t) * w.amplitude;
                    const wave2 = Math.cos(x * w.frequency * 0.6 - t * 0.8) * (w.amplitude * 0.4);
                    const y = w.baseY + wave1 + wave2;

                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
                ctx.restore();
            }

            // 2. Gambar kilauan cahaya matahari pada permukaan air (Sparkles)
            for (let i = 0; i < sparkles.length; i++) {
                const s = sparkles[i];
                s.phase += s.twinkleSpeed * delta;
                s.rotation += s.rotSpeed;

                const sinVal = (Math.sin(s.phase) + 1) * 0.5;
                const alpha = s.maxAlpha * Math.pow(sinVal, 2.2);

                if (alpha > 0.05) {
                    drawSparkle(s.x, s.y, s.size * (0.8 + 0.4 * sinVal), alpha, s.rotation, s.type === 'iridescent');
                }
            }

            // 3. Gambar riak air sentuhan (Interactive Ripples)
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.radius += r.speed;
                r.alpha *= 0.982;

                if (r.alpha <= 0.015 || r.radius >= r.maxRadius) {
                    ripples.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.65})`;
                ctx.lineWidth = r.width;
                ctx.stroke();

                if (r.radius > 12) {
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, r.radius * 0.82, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(180, 240, 255, ${r.alpha * 0.35})`;
                    ctx.lineWidth = r.width * 0.7;
                    ctx.stroke();
                }

                ctx.restore();
            }

            // 4. Riak air otomatis saat layar santai tidak disentuh
            if (time > nextIdleDropTime) {
                const dropX = width * (0.2 + Math.random() * 0.6);
                const dropY = height * (0.2 + Math.random() * 0.6);
                addRipple(dropX, dropY, 0.55);
                nextIdleDropTime = time + (isMobile ? 5500 : 4200) + Math.random() * 2500;
            }

            // 5. Animasi halus frekuensi gelombang pada SVG displacement filter (HANYA DESKTOP)
            // Di HP atribut SVG feTurbulence tidak diupdate per frame agar rendering GPU tidak stutter
            if (turbulenceEl && !isMobile) {
                const freqX = 0.012 + Math.sin(time * 0.0006) * 0.0025;
                const freqY = 0.020 + Math.cos(time * 0.0005) * 0.003;
                turbulenceEl.setAttribute('baseFrequency', `${freqX.toFixed(5)} ${freqY.toFixed(5)}`);
            }
        }

        let resizeTimeout = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resize, 150);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            } else {
                lastTime = performance.now();
                lastRenderTime = performance.now();
                if (!animationFrameId) {
                    animationFrameId = requestAnimationFrame(render);
                }
            }
        });

        resize();
        animationFrameId = requestAnimationFrame(render);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupWater);
    } else {
        setupWater();
    }
})();

// ==========================================
// 0. ANIMASI LOADING "I LOVE YOU" MEMBENTUK HATI
// ==========================================
(function () {
    const isMobileLoading = window.innerWidth <= 768;
    const PARTICLE_COUNT = isMobileLoading ? 48 : 80;
    const LOVE_TEXTS = ['I love you', 'i love u', 'love', 'ily', '♡', 'luv u', 'sayang', 'cinta'];

    // Parametric heart shape formula
    function heartX(t) {
        return 16 * Math.pow(Math.sin(t), 3);
    }
    function heartY(t) {
        return -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    }

    function mulaiAnimasiLoading() {
        const container = document.getElementById('love-particles-container');
        const loadingScreen = document.getElementById('love-loading-screen');
        const tapText = document.getElementById('loading-tap-text');
        if (!container || !loadingScreen) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const centerX = vw / 2;
        const centerY = vh / 2;
        const scale = Math.min(vw, vh) * 0.018;

        const particles = [];

        // Generate heart shape target positions (relative to center)
        const heartPoints = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const t = (i / PARTICLE_COUNT) * Math.PI * 2;
            heartPoints.push({
                x: heartX(t) * scale,
                y: heartY(t) * scale - 20
            });
        }

        // Build all particles in a document fragment (single DOM insert)
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const el = document.createElement('span');
            el.classList.add('love-particle');
            el.textContent = LOVE_TEXTS[Math.floor(Math.random() * LOVE_TEXTS.length)];

            const fontSize = 8 + Math.random() * 6;
            el.style.fontSize = fontSize + 'px';

            // All particles start at center, use transform for positioning
            el.style.left = centerX + 'px';
            el.style.top = centerY + 'px';

            // Scatter offset from center (bottom area)
            const scatterX = -centerX + Math.random() * vw;
            const scatterY = vh * 0.1 + Math.random() * vh * 0.4;
            const rotation = -30 + Math.random() * 60;

            // Random color
            const colors = [
                'rgba(255, 182, 193, 0.9)',
                'rgba(255, 150, 180, 0.85)',
                'rgba(255, 200, 220, 0.8)',
                'rgba(220, 160, 255, 0.7)',
                'rgba(255, 255, 255, 0.6)',
                'rgba(255, 130, 170, 0.9)'
            ];
            el.style.color = colors[Math.floor(Math.random() * colors.length)];

            fragment.appendChild(el);
            particles.push({
                el: el,
                scatterX: scatterX,
                scatterY: scatterY,
                rotation: rotation,
                heartX: heartPoints[i].x,
                heartY: heartPoints[i].y
            });
        }

        container.appendChild(fragment);

        // Phase 1: Show scattered particles with staggered fade-in
        requestAnimationFrame(() => {
            particles.forEach((p, i) => {
                setTimeout(() => {
                    p.el.style.transform = 'translate(' + p.scatterX + 'px, ' + p.scatterY + 'px) rotate(' + p.rotation + 'deg)';
                    p.el.classList.add('scattered');
                }, 50 + i * 12);
            });
        });

        // Phase 2: Float particles upward slightly (1.5s)
        setTimeout(() => {
            particles.forEach(p => {
                const driftX = p.scatterX + (-40 + Math.random() * 80);
                const driftY = p.scatterY - (20 + Math.random() * 60);
                p.el.style.transform = 'translate(' + driftX + 'px, ' + driftY + 'px) rotate(' + (p.rotation * 0.5) + 'deg)';
            });
        }, 1500);

        // Phase 3: Form the heart shape (3s)
        setTimeout(() => {
            particles.forEach((p, i) => {
                const staggerDelay = (i / PARTICLE_COUNT) * 1000;
                p.el.style.transitionDuration = '2.5s';
                p.el.style.transitionDelay = staggerDelay + 'ms';

                setTimeout(() => {
                    p.el.style.transform = 'translate(' + p.heartX + 'px, ' + p.heartY + 'px) rotate(0deg) scale(1)';
                    p.el.classList.remove('scattered');
                    p.el.classList.add('formed');
                }, 30);
            });
        }, 3000);

        // Phase 4: Add glow pulse & sparkles after heart is formed (6.5s)
        setTimeout(() => {
            particles.forEach((p, i) => {
                p.el.classList.add('glow-pulse');
            });

            buatSparkles(container, heartPoints, centerX, centerY);
            if (tapText) tapText.classList.add('show');
        }, 6500);

        // Click/tap to dismiss with planet transition
        let bisaDismiss = false;
        setTimeout(() => { bisaDismiss = true; }, 6000);
        loadingScreen.addEventListener('click', function () {
            if (!bisaDismiss) return;
            bisaDismiss = false;

            if (tapText) tapText.classList.remove('show');

            // Phase A: SUCK particles into the center
            particles.forEach((p) => {
                p.el.style.transitionDuration = '0.8s';
                p.el.style.transitionDelay = (Math.random() * 150) + 'ms';
                p.el.style.transitionTimingFunction = 'cubic-bezier(0.5, 0, 1, 0.5)';
                p.el.style.transform = 'translate(0px, 0px) scale(0) rotate(180deg)';
                p.el.style.opacity = '0';
            });

            // Phase B: Fade out screen
            setTimeout(() => {
                loadingScreen.style.transition = 'opacity 1s ease';
                loadingScreen.style.opacity = '0';
            }, 800);

            // Phase C: Show PIN screen instead of landing page
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                container.innerHTML = ''; // Bebaskan elemen DOM partikel untuk hemat memori HP
                const pinScreen = document.getElementById('pin-screen');
                if (pinScreen) {
                    pinScreen.style.display = 'flex';
                    // Delay sedikit agar transisi CSS jalan
                    setTimeout(() => {
                        pinScreen.classList.add('active');
                    }, 50);
                }
            }, 1800);
        });

        // ==========================================
        // PIN VALIDATION LOGIC (Pop-Up Notifikasi)
        // ==========================================
        const pinInput = document.getElementById('pin-input');
        const pinPopupOverlay = document.getElementById('pin-popup-overlay');
        const pinPopupBox = document.getElementById('pin-popup-box');
        const pinPopupImg = document.getElementById('pin-popup-img');
        const pinPopupEmoji = document.getElementById('pin-popup-emoji');
        const pinPopupMsg = document.getElementById('pin-popup-msg');
        const pinPopupClose = document.getElementById('pin-popup-close');

        // DEFAULT PIN: Silakan ubah angka ini jika ingin PIN lain
        const SECRET_PIN = "2505";

        let pinAttempt = 0;
        let popupTimeout = null;

        // Konfigurasi pesan & tampilan setiap percobaan salah
        const wrongConfigs = [
            {
                // Percobaan pertama: tampilkan foto kucing
                showCat: true,
                emoji: '',
                message: 'Masa tanggal spesial kita lupa?',
                buttonText: 'Iya iya maaf 😭'
            },
            {
                // Percobaan kedua: foto kucing marah
                showCat: true,
                catSrc: 'img/cat-angry.png',
                emoji: '',
                message: 'Serius lupa?!\nYaudah coba lagi deh.',
                buttonText: 'Sekali lagi 🙏'
            },
            {
                // Percobaan ketiga+: foto kucing thumbs up
                showCat: true,
                catSrc: 'img/cat-thumbsup.png',
                emoji: '',
                message: 'Kalau masih salah,\nketerlaluan sih.',
                buttonText: 'Ampun 😭'
            }
        ];

        function showPinPopup(config, isSuccess) {
            // Bersihkan timeout sebelumnya
            if (popupTimeout) clearTimeout(popupTimeout);

            // Reset semua state
            pinPopupBox.classList.remove('popup-success', 'shake-popup');
            pinPopupImg.classList.remove('wiggle-cat', 'hidden-img');
            pinPopupEmoji.classList.remove('show-emoji');
            pinPopupEmoji.textContent = '';

            if (isSuccess) {
                // Tampilan sukses — pakai foto kucing senang
                pinPopupImg.src = 'img/cat-success.png';
                pinPopupImg.classList.remove('hidden-img');
                pinPopupBox.classList.add('popup-success');
                pinPopupMsg.textContent = config.message;
                pinPopupClose.textContent = config.buttonText;
                setTimeout(() => {
                    pinPopupImg.classList.add('wiggle-cat');
                }, 400);
            } else {
                // Tampilan salah
                if (config.showCat) {
                    // Tampilkan gambar kucing + animasi wiggle
                    pinPopupImg.src = config.catSrc || 'img/cat-warning.png';
                    pinPopupImg.classList.remove('hidden-img');
                    setTimeout(() => {
                        pinPopupImg.classList.add('wiggle-cat');
                    }, 400);
                } else {
                    // Sembunyikan gambar, tampilkan emoji
                    pinPopupImg.classList.add('hidden-img');
                    pinPopupEmoji.textContent = config.emoji;
                    pinPopupEmoji.classList.add('show-emoji');
                    // Tambah padding atas karena tidak ada gambar yang menonjol
                    pinPopupBox.style.paddingTop = '30px';
                }

                pinPopupMsg.textContent = config.message;
                pinPopupClose.textContent = config.buttonText;

                // Shake animation setelah muncul
                setTimeout(() => {
                    pinPopupBox.classList.add('shake-popup');
                }, 500);
            }

            // Tampilkan pop-up
            pinPopupOverlay.classList.add('show-popup');
        }

        function closePinPopup() {
            pinPopupOverlay.classList.remove('show-popup');
            if (popupTimeout) clearTimeout(popupTimeout);
            // Reset padding
            pinPopupBox.style.paddingTop = '';
        }

        // Event listener untuk tombol tutup
        if (pinPopupClose) {
            pinPopupClose.addEventListener('click', closePinPopup);
        }

        // Tutup pop-up dengan klik overlay (di luar box)
        if (pinPopupOverlay) {
            pinPopupOverlay.addEventListener('click', function (e) {
                if (e.target === pinPopupOverlay) {
                    closePinPopup();
                }
            });
        }

        if (pinInput) {
            pinInput.addEventListener('input', function () {
                if (pinInput.value.length === 4) {
                    // Delay sedikit agar digit terakhir terasa diketik
                    setTimeout(() => {
                        if (pinInput.value === SECRET_PIN) {
                            // PIN BENAR
                            showPinPopup({
                                message: 'Valid!\nLanjut ya sayang~',
                                buttonText: 'Lanjut 💕'
                            }, true);

                            // Auto-close dan lanjut setelah 2 detik
                            popupTimeout = setTimeout(() => {
                                closePinPopup();
                                setTimeout(() => {
                                    const pinScreen = document.getElementById('pin-screen');
                                    pinScreen.classList.remove('active');

                                    setTimeout(() => {
                                        pinScreen.style.display = 'none';
                                        const landingPage = document.getElementById('landing-page');
                                        if (landingPage) landingPage.style.display = '';
                                    }, 1000);
                                }, 300);
                            }, 2000);

                            // Juga lanjut saat tombol diklik
                            pinPopupClose.onclick = function () {
                                closePinPopup();
                                setTimeout(() => {
                                    const pinScreen = document.getElementById('pin-screen');
                                    pinScreen.classList.remove('active');

                                    setTimeout(() => {
                                        pinScreen.style.display = 'none';
                                        const landingPage = document.getElementById('landing-page');
                                        if (landingPage) landingPage.style.display = '';
                                    }, 1000);
                                }, 300);
                            };
                        } else {
                            // PIN SALAH
                            const configIndex = Math.min(pinAttempt, wrongConfigs.length - 1);
                            showPinPopup(wrongConfigs[configIndex], false);
                            pinAttempt++;

                            pinInput.classList.add('shake-animation');
                            setTimeout(() => pinInput.classList.remove('shake-animation'), 400);
                            pinInput.value = '';

                            // Reset tombol close ke default
                            pinPopupClose.onclick = closePinPopup;
                        }
                    }, 150);
                }
            });
        }
    }

    function buatSparkles(container, heartPoints, centerX, centerY) {
        const sparkleInterval = setInterval(() => {
            const sparkle = document.createElement('div');
            sparkle.classList.add('heart-sparkle');

            const randomPoint = heartPoints[Math.floor(Math.random() * heartPoints.length)];
            const offsetX = -15 + Math.random() * 30;
            const offsetY = -15 + Math.random() * 30;

            sparkle.style.left = (centerX + randomPoint.x + offsetX) + 'px';
            sparkle.style.top = (centerY + randomPoint.y + offsetY) + 'px';
            sparkle.style.animation = 'sparkleFloat ' + (1.5 + Math.random() * 1.5) + 's ease-out forwards';

            container.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 3000);
        }, 400);

        document.getElementById('love-loading-screen').addEventListener('click', () => {
            clearInterval(sparkleInterval);
        }, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mulaiAnimasiLoading);
    } else {
        mulaiAnimasiLoading();
    }
})();

// ==========================================
// 1. FUNGSI FOTO MEMBESAR (LIGHTBOX) & PEMUTAR MUSIK
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    const daftarFoto = document.querySelectorAll('.gallery-scroll img, .polaroid, .planet-card');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalIframe = document.getElementById('modal-iframe'); // Panggil elemen iframe
    const modalCaption = document.getElementById('modal-caption');

    if (daftarFoto.length > 0 && modal && modalImg) {
        daftarFoto.forEach(foto => {
            foto.addEventListener('click', function () {

                // Reset layar setiap kali diklik
                if (modalCaption) modalCaption.innerText = "";
                modalImg.style.display = 'block'; // Tampilkan foto sebagai default
                modalIframe.style.display = 'none'; // Sembunyikan musik sebagai default
                modalIframe.src = ""; // Kosongkan lagu sebelumnya

                // A. JIKA YANG DIKLIK ADALAH KARTU LAGU/VIDEO (Punya data-embed)
                if (this.classList.contains('planet-card') && this.hasAttribute('data-embed')) {
                    modalImg.style.display = 'none'; // Sembunyikan foto
                    modalIframe.style.display = 'block'; // Tampilkan alat musik/video

                    let embedUrl = this.getAttribute('data-embed');

                    // Hapus class lama
                    modalIframe.classList.remove('iframe-spotify', 'iframe-youtube', 'iframe-facebook', 'iframe-tiktok');

                    // Deteksi platform untuk penyesuaian rasio (16:9 untuk YouTube, Kotak untuk Spotify, 9:16 untuk Facebook/TikTok)
                    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                        modalIframe.classList.add('iframe-youtube');
                        if (embedUrl.includes('watch?v=')) {
                            const ytId = embedUrl.split('watch?v=')[1].split('&')[0];
                            embedUrl = `https://www.youtube.com/embed/${ytId}`;
                        } else if (embedUrl.includes('youtu.be/')) {
                            const ytId = embedUrl.split('youtu.be/')[1].split('?')[0];
                            embedUrl = `https://www.youtube.com/embed/${ytId}`;
                        }
                    } else if (embedUrl.includes('spotify.com')) {
                        modalIframe.classList.add('iframe-spotify');
                    } else if (embedUrl.includes('facebook.com')) {
                        modalIframe.classList.add('iframe-facebook');
                    } else if (embedUrl.includes('tiktok.com')) {
                        modalIframe.classList.add('iframe-tiktok');
                        // Otomatis ubah URL TikTok biasa (misal https://www.tiktok.com/@user/video/1234567890) ke embed player jika belum
                        const tiktokMatch = embedUrl.match(/(?:video\/|player\/v1\/|embed\/v2\/)(\d+)/);
                        if (tiktokMatch && tiktokMatch[1] && !embedUrl.includes('/player/v1/')) {
                            embedUrl = `https://www.tiktok.com/player/v1/${tiktokMatch[1]}`;
                        }
                    }

                    modalIframe.src = embedUrl; // Masukkan link

                    const customCaption = this.getAttribute('data-caption');
                    const teksCaption = customCaption ? customCaption : this.querySelector('.planet-caption').innerText;
                    if (modalCaption) modalCaption.innerText = teksCaption;
                }
                // B. JIKA YANG DIKLIK ADALAH KARTU 3D BIASA (Bukan Lagu)
                else if (this.classList.contains('planet-card')) {
                    modalImg.src = this.querySelector('img').src;
                    modalImg.style.aspectRatio = "3 / 4";

                    const customCaption = this.getAttribute('data-caption');
                    const teksCaption = customCaption ? customCaption : this.querySelector('.planet-caption').innerText;
                    if (modalCaption) modalCaption.innerText = teksCaption;
                }
                // C. JIKA YANG DIKLIK ADALAH POLAROID
                else if (this.classList.contains('polaroid')) {
                    modalImg.src = this.querySelector('img').src;
                    modalImg.style.aspectRatio = "3 / 4";
                    const polaroidCap = this.querySelector('.caption');
                    if (modalCaption) modalCaption.innerText = polaroidCap ? polaroidCap.innerText : '';
                }
                // D. JIKA YANG DIKLIK ADALAH GALERI CINTA
                else {
                    modalImg.src = this.src;
                    modalImg.style.aspectRatio = "9 / 16";
                }

                modal.classList.add('show-modal');
            });
        });
    }

    const semuaTeksKetikan = document.querySelectorAll('.typing-text');
    semuaTeksKetikan.forEach(el => {
        el.setAttribute('data-teks', el.innerHTML);
        el.innerHTML = '';
    });
});

// Fungsi Menutup Layar & Mematikan Lagu
function tutupModal() {
    const modal = document.getElementById('image-modal');
    const modalIframe = document.getElementById('modal-iframe');

    if (modal) {
        modal.classList.remove('show-modal');
        // KUNCI PENTING: Mengosongkan src agar lagu berhenti berputar saat ditutup
        if (modalIframe) {
            modalIframe.src = "";
        }
    }
}

// ==========================================
// 2. FUNGSI KADO & PEMUTAR MUSIK LATAR
// ==========================================
function bukaKado() {
    buatHujanBunga();

    const flash = document.getElementById('flash-light');
    if (flash) flash.classList.add('flash-active');

    // --- MULAI MUSIK & MUNCULKAN POP-UP ---
    const bgMusic = document.getElementById('bg-music');
    const musicPopup = document.getElementById('music-popup');

    // Putar musiknya
    if (bgMusic) {
        bgMusic.play().catch(error => {
            console.log("Browser memblokir autoplay, tidak masalah.");
        });
    }

    // Munculkan notifikasi pop-up dari bawah layar
    if (musicPopup) {
        setTimeout(() => {
            musicPopup.classList.add('show-music');
        }, 1000);
    }
    // --------------------------------------

    setTimeout(() => {
        const landingPage = document.getElementById('landing-page');
        const mainContent = document.getElementById('main-content');

        if (landingPage) landingPage.style.display = 'none';
        if (mainContent) mainContent.classList.remove('hidden');

        jalankanAnimasiScroll();
    }, 450);
}

function buatHujanBunga() {
    const container = document.getElementById('flower-rain');
    if (!container) return;

    const bungaPilihan = ['🌸', '🌺', '🌷', '✨', '💖'];
    const isMobile = window.innerWidth <= 768;
    const petalCount = isMobile ? 22 : 40;

    for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');

        petal.innerText = bungaPilihan[Math.floor(Math.random() * bungaPilihan.length)];
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = (Math.random() * 3 + 2) + 's';
        petal.style.animationDelay = (Math.random() * 1) + 's';

        container.appendChild(petal);

        setTimeout(() => {
            petal.remove();
        }, 6000);
    }
}

// ==========================================
// 3. FUNGSI SENSOR SCROLL & MESIN TIK BERURUTAN
// ==========================================
function jalankanAnimasiScroll() {
    const elemenScroll = document.querySelectorAll('.show-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                if (!entry.target.classList.contains('is-visible')) {
                    entry.target.classList.add('is-visible');
                    mulaiKetikanBerurutan(entry.target);
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -35% 0px"
    });

    elemenScroll.forEach((el) => observer.observe(el));
}

async function mulaiKetikanBerurutan(slideTarget) {
    const teksKetikan = slideTarget.querySelectorAll('.typing-text');

    await new Promise(resolve => setTimeout(resolve, 3500));

    for (let i = 0; i < teksKetikan.length; i++) {
        const el = teksKetikan[i];
        const teksAsli = el.getAttribute('data-teks');

        if (teksAsli) {
            await ketikTeks(el, teksAsli);
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }

    // Tampilkan pulsating heart dengan fade in setelah semua teks selesai diketik
    const heart = slideTarget.querySelector('.pulsating-heart');
    if (heart) {
        heart.classList.add('heart-visible');
    }
}

function ketikTeks(elemen, teks) {
    return new Promise(resolve => {
        let index = 0;
        elemen.innerHTML = '';

        function ketik() {
            if (index < teks.length) {
                elemen.innerHTML += teks.charAt(index);
                index++;
                setTimeout(ketik, 35);
            } else {
                elemen.classList.add('typing-done');
                resolve();
            }
        }

        ketik();
    });
}

// ==========================================
// 4. FUNGSI TOGGLE PLAY/PAUSE MUSIK (SPOTIFY STYLE)
// ==========================================
function toggleMusic() {
    const bgMusic = document.getElementById('bg-music');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');

    if (!bgMusic) return;

    if (bgMusic.paused) {
        bgMusic.play().catch(console.error);
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
    } else {
        bgMusic.pause();
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
    }
}

// ==========================================
// 5. FUNGSI MENYEMBUNYIKAN POP-UP MUSIK SAAT SCROLL
// ==========================================
function hideMusicPopup() {
    const musicPopup = document.getElementById('music-popup');
    const showMusicBtn = document.getElementById('show-music-btn');
    if (musicPopup) {
        musicPopup.classList.remove('show-music');
    }
    if (showMusicBtn) {
        showMusicBtn.classList.add('show-btn');
    }
}

function showMusicPopup() {
    const musicPopup = document.getElementById('music-popup');
    const showMusicBtn = document.getElementById('show-music-btn');
    if (musicPopup) {
        musicPopup.classList.add('show-music');
    }
    if (showMusicBtn) {
        showMusicBtn.classList.remove('show-btn');
    }
}

// Auto-hide pop-up musik saat user mulai scroll
(function () {
    let sudahDisembunyikan = false;

    window.addEventListener('scroll', function () {
        const musicPopup = document.getElementById('music-popup');

        // Hanya sembunyikan jika pop-up sedang tampil dan belum pernah disembunyikan oleh scroll
        if (!sudahDisembunyikan && musicPopup && musicPopup.classList.contains('show-music')) {
            hideMusicPopup();
            sudahDisembunyikan = true;
        }
    });

    // Reset flag saat pop-up ditampilkan kembali lewat tombol 🎵
    const originalShowMusicPopup = showMusicPopup;
    showMusicPopup = function () {
        sudahDisembunyikan = false;
        originalShowMusicPopup();
    };
    // Pasang ulang ke window agar onclick di HTML tetap berfungsi
    window.showMusicPopup = showMusicPopup;
})();

// ==========================================
// SCRATCH CARD (ERASER EFFECT) + GALLERY UNLOCK LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('.scratch-canvas');
    const galleryScroll = document.querySelector('.gallery-scroll');
    const galleryHint = document.getElementById('gallery-hint');
    const gallerySlider = document.getElementById('gallery-slider');
    const gallerySliderThumb = document.getElementById('gallery-slider-thumb');

    const totalCanvases = canvases.length;
    const clearedSet = new Set();
    let galleryUnlocked = false;

    let sliderRaf = null;
    function updateSlider() {
        if (!gallerySliderThumb || !galleryScroll) return;
        if (sliderRaf) return;
        sliderRaf = requestAnimationFrame(() => {
            const maxScroll = galleryScroll.scrollWidth - galleryScroll.clientWidth;
            if (maxScroll > 0) {
                const scrollPercent = galleryScroll.scrollLeft / maxScroll;
                const trackWidth = gallerySliderThumb.parentElement.clientWidth;
                const thumbWidth = gallerySliderThumb.clientWidth;
                const maxLeft = trackWidth - thumbWidth;
                gallerySliderThumb.style.left = (scrollPercent * maxLeft) + 'px';
            }
            sliderRaf = null;
        });
    }

    function scrollToCard(cardIndex) {
        if (!galleryScroll) return;
        const cards = galleryScroll.querySelectorAll('.scratch-card');
        if (cardIndex < cards.length) {
            const card = cards[cardIndex];
            // Hitung posisi scroll secara manual agar card berada di tengah container
            // Ini menghindari scrollIntoView yang bisa menggeser seluruh halaman di HP
            const containerWidth = galleryScroll.clientWidth;
            const cardLeft = card.offsetLeft;
            const cardWidth = card.offsetWidth;
            const targetScroll = cardLeft - (containerWidth / 2) + (cardWidth / 2);

            // Sementara aktifkan scroll agar bisa geser
            galleryScroll.style.overflowX = 'auto';
            galleryScroll.scrollTo({ left: targetScroll, behavior: 'smooth' });
            // Kunci lagi setelah scroll selesai
            setTimeout(() => {
                if (!galleryUnlocked) {
                    galleryScroll.style.overflowX = 'hidden';
                }
                updateSlider();
            }, 600);
        }
    }

    // Tampilkan slider dari awal
    if (gallerySlider) {
        gallerySlider.classList.add('slider-visible');
    }

    // Preload gambar background air untuk motif canvas gosok
    const waterBgImage = new Image();
    waterBgImage.src = 'img/water-bg.jpg';

    function paintWaterScratchCanvas(canvas, ctx, index) {
        const w = canvas.width;
        const h = canvas.height;

        // 1. Warna dasar gradasi air turquoise/aquamarine sama persis dengan background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#5ee2f7');
        grad.addColorStop(0.35, '#38caea');
        grad.addColorStop(0.7, '#1faed4');
        grad.addColorStop(1, '#118dae');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. Gambar motif background air (water-bg.jpg)
        if (waterBgImage.complete && waterBgImage.naturalWidth > 0) {
            const imgW = waterBgImage.naturalWidth;
            const imgH = waterBgImage.naturalHeight;
            const sWidth = imgW;
            const sHeight = Math.min(imgH, imgW * (h / w));
            const maxOffsetY = Math.max(0, imgH - sHeight);
            const offsetY = maxOffsetY > 0 ? (index % 3) * (maxOffsetY / 2) : 0;

            ctx.drawImage(
                waterBgImage,
                0, offsetY, sWidth, sHeight,
                0, 0, w, h
            );
        }

        // 3. Efek kilauan & caustics sinar matahari yang menyatu dengan air
        const shimmer = ctx.createRadialGradient(
            w * 0.4, h * 0.25, 10,
            w * 0.5, h * 0.45, w * 0.85
        );
        shimmer.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        shimmer.addColorStop(0.3, 'rgba(200, 245, 255, 0.22)');
        shimmer.addColorStop(0.7, 'rgba(160, 230, 248, 0.08)');
        shimmer.addColorStop(1, 'rgba(4, 35, 60, 0.18)');
        ctx.fillStyle = shimmer;
        ctx.fillRect(0, 0, w, h);

        // 4. Titik-titik pantulan sinar air halus
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const sparkles = [
            { x: w * 0.25, y: h * 0.18, r: 2.2 },
            { x: w * 0.78, y: h * 0.28, r: 1.8 },
            { x: w * 0.22, y: h * 0.65, r: 1.6 },
            { x: w * 0.82, y: h * 0.72, r: 2.0 },
            { x: w * 0.5, y: h * 0.12, r: 2.5 }
        ];
        sparkles.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // 6. Mode destination-out agar saat digosok langsung menghapus motif air dan memunculkan foto
        ctx.globalCompositeOperation = 'destination-out';
    }

    waterBgImage.onload = () => {
        canvases.forEach((canvas, index) => {
            if (!canvas._hasStartedScratching && !clearedSet.has(index)) {
                const ctx = canvas.getContext('2d');
                ctx.globalCompositeOperation = 'source-over';
                paintWaterScratchCanvas(canvas, ctx, index);
            }
        });
    };

    function checkCanvasCleared(canvas, index) {
        if (clearedSet.has(index)) return;

        let ratio = 0;
        try {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let transparentCount = 0;
            let sampledCount = 0;

            for (let i = 3; i < pixels.length; i += 24) {
                sampledCount++;
                if (pixels[i] === 0) transparentCount++;
            }

            ratio = transparentCount / sampledCount;
        } catch (err) {
            // Jika canvas di-taint (misal dibuka langsung via file:// di Chrome),
            // fallback gunakan jumlah goresan gosok agar tetap 100% berfungsi normal
            if (canvas._erasedStrokes && canvas._erasedStrokes >= 25) {
                ratio = 0.5;
            }
        }

        if (ratio > 0.45) {
            clearedSet.add(index);
            // Fade out sisa canvas
            canvas.style.transition = 'opacity 0.5s ease';
            canvas.style.opacity = '0';
            setTimeout(() => {
                canvas.style.pointerEvents = 'none';
            }, 500);

            // Update hint
            if (galleryHint) {
                galleryHint.textContent = '✨ Foto ' + clearedSet.size + ' dari ' + totalCanvases + ' terbuka ✨';
            }

            // Cek apakah semua sudah dibersihkan
            if (clearedSet.size >= totalCanvases) {
                // Semua selesai — unlock untuk geser bebas
                galleryUnlocked = true;
                if (galleryScroll) {
                    galleryScroll.classList.add('gallery-unlocked');
                    galleryScroll.style.overflowX = 'auto';
                    galleryScroll.style.touchAction = 'pan-x pan-y';
                    // Sync slider saat scroll bebas
                    galleryScroll.addEventListener('scroll', updateSlider, { passive: true });
                }
                if (galleryHint) {
                    galleryHint.textContent = 'Semua foto sudah terbuka! Geser kesamping untuk melihatnya';
                    galleryHint.classList.add('hint-unlocked');
                }
            } else {
                // Auto-scroll ke foto berikutnya
                setTimeout(() => {
                    scrollToCard(index + 1);
                }, 700);
            }
        }
    }

    canvases.forEach((canvas, index) => {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let brushRadius = 25;
        let drawMoveCount = 0;
        let cachedRect = null;
        let scaleX = 1;
        let scaleY = 1;

        setTimeout(() => {
            canvas.width = 220;
            canvas.height = Math.round(220 * 16 / 9);

            paintWaterScratchCanvas(canvas, ctx, index);

            const updateRect = () => {
                cachedRect = canvas.getBoundingClientRect();
                scaleX = canvas.width / (cachedRect.width || 1);
                scaleY = canvas.height / (cachedRect.height || 1);
            };

            const startPosition = (e) => {
                isDrawing = true;
                canvas._hasStartedScratching = true;
                drawMoveCount = 0;
                updateRect();
                draw(e);
            };

            const endPosition = () => {
                if (!isDrawing) return;
                isDrawing = false;
                ctx.beginPath();
                // Cek setiap kali selesai menggosok
                checkCanvasCleared(canvas, index);
            };

            const draw = (e) => {
                if (!isDrawing) return;

                let clientX, clientY;
                if (e.touches && e.touches[0]) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                if (!cachedRect) updateRect();

                const x = (clientX - cachedRect.left) * scaleX;
                const y = (clientY - cachedRect.top) * scaleY;

                ctx.lineWidth = brushRadius * 2;
                ctx.lineCap = 'round';
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);

                canvas._erasedStrokes = (canvas._erasedStrokes || 0) + 1;

                // Cek selama menggosok setiap 24 gerakan untuk menjaga FPS tetap 60
                drawMoveCount++;
                if (drawMoveCount % 24 === 0) {
                    checkCanvasCleared(canvas, index);
                }
            };

            canvas.addEventListener('mousedown', startPosition);
            canvas.addEventListener('mouseup', endPosition);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseleave', endPosition);

            canvas.addEventListener('touchstart', startPosition, { passive: true });
            canvas.addEventListener('touchend', endPosition);
            canvas.addEventListener('touchmove', (e) => {
                if (isDrawing) e.preventDefault();
                draw(e);
            }, { passive: false });

        }, 400);
    });
});

// ==========================================
// FITUR TIUP LILIN 🎂 (Press & Hold)
// ==========================================
let holdTime = 0;
let holdInterval = null;
let holdCurrentStage = 0;
let holdListenersAttached = false;
let holdStartFn = null;
let holdStopFn = null;

const STAGE_1_DURATION = 6000;  // 6 detik untuk tahap 1
const STAGE_2_DURATION = 13000; // 13 detik total (7 detik tambahan) untuk tahap 2

function bukaHalamanLilin() {
    const candlePage = document.getElementById('candle-page');
    if (!candlePage) return;

    // Reset state
    holdTime = 0;
    holdCurrentStage = 0;
    holdListenersAttached = false;

    // Tampilkan halaman
    candlePage.classList.add('active');

    // Buat sparkle background
    buatSparkleBackground(candlePage);

    // Fade in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            candlePage.classList.add('visible');
        });
    });
}

function tutupHalamanLilin() {
    const candlePage = document.getElementById('candle-page');
    const msg = document.getElementById('candle-message');
    const btn = document.getElementById('btn-mulai-tiup');
    const tapHint = document.getElementById('tap-hint');
    const flames = document.querySelectorAll('.candle-flame');
    const progressBar = document.getElementById('hold-progress-bar');
    const progressFill = document.getElementById('hold-progress-fill');
    const cakeContainer = document.querySelector('.cake-container');

    if (!candlePage) return;

    // Stop hold interval
    if (holdInterval) {
        clearInterval(holdInterval);
        holdInterval = null;
    }

    // Hapus event listeners
    hapusHoldListeners(candlePage);

    // Fade out
    candlePage.classList.remove('visible');

    setTimeout(() => {
        candlePage.classList.remove('active');

        // Reset semua state
        holdTime = 0;
        holdCurrentStage = 0;

        if (msg) {
            msg.textContent = '';
            msg.className = 'candle-message';
        }

        if (btn) btn.classList.remove('hidden-btn');

        if (tapHint) {
            tapHint.textContent = '';
            tapHint.className = 'tap-hint';
        }

        if (progressBar) progressBar.classList.remove('show-bar');
        if (progressFill) progressFill.style.width = '0%';
        if (cakeContainer) cakeContainer.classList.remove('holding');

        // Reset api lilin
        flames.forEach(flame => {
            flame.classList.remove('dimming', 'extinguished');
            flame.style.animationDuration = '';
        });

        // Hapus sparkle elements
        const sparkles = candlePage.querySelectorAll('.candle-sparkle');
        sparkles.forEach(s => s.remove());
    }, 800);
}

function hapusHoldListeners(candlePage) {
    if (holdListenersAttached && holdStartFn && holdStopFn) {
        candlePage.removeEventListener('mousedown', holdStartFn);
        candlePage.removeEventListener('mouseup', holdStopFn);
        candlePage.removeEventListener('mouseleave', holdStopFn);
        candlePage.removeEventListener('touchstart', holdStartFn);
        candlePage.removeEventListener('touchend', holdStopFn);
        candlePage.removeEventListener('touchcancel', holdStopFn);
        holdListenersAttached = false;
    }
}

function buatSparkleBackground(container) {
    const isMobileSparkle = window.innerWidth <= 768;
    const sparkleCount = isMobileSparkle ? 12 : 30;
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('candle-sparkle');
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = (Math.random() * 3) + 's';
        sparkle.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        container.appendChild(sparkle);
    }
}

function mulaiTiupLilin() {
    const btn = document.getElementById('btn-mulai-tiup');
    const tapHint = document.getElementById('tap-hint');
    const candlePage = document.getElementById('candle-page');
    const progressBar = document.getElementById('hold-progress-bar');

    if (!btn || !candlePage) return;

    // Sembunyikan tombol
    btn.classList.add('hidden-btn');

    // Tampilkan progress bar & hint
    if (progressBar) progressBar.classList.add('show-bar');
    if (tapHint) {
        tapHint.textContent = 'Tekan dan tahan layar untuk meniup lilin';
        tapHint.className = 'tap-hint show-hint';
    }

    // Reset hold state
    holdTime = 0;
    holdCurrentStage = 0;

    // Setup hold event listeners
    holdStartFn = function (e) {
        // Jangan proses jika klik tombol kembali
        if (e.target.closest('.btn-back-candle')) return;
        // Jangan proses jika sudah selesai
        if (holdCurrentStage >= 3) return;

        e.preventDefault();
        startHolding();
    };

    holdStopFn = function () {
        if (holdCurrentStage >= 3) return;
        stopHolding();
    };

    candlePage.addEventListener('mousedown', holdStartFn);
    candlePage.addEventListener('mouseup', holdStopFn);
    candlePage.addEventListener('mouseleave', holdStopFn);
    candlePage.addEventListener('touchstart', holdStartFn, { passive: false });
    candlePage.addEventListener('touchend', holdStopFn);
    candlePage.addEventListener('touchcancel', holdStopFn);
    holdListenersAttached = true;
}

function startHolding() {
    const cakeContainer = document.querySelector('.cake-container');
    const tapHint = document.getElementById('tap-hint');

    if (cakeContainer) cakeContainer.classList.add('holding');
    if (tapHint) tapHint.className = 'tap-hint'; // Sembunyikan hint saat menekan

    // Jika belum masuk tahap 1, langsung masuk
    if (holdCurrentStage === 0) {
        holdCurrentStage = 1;
        tampilkanTahap1();
    }

    // Mulai interval untuk menambah holdTime
    if (holdInterval) clearInterval(holdInterval);
    holdInterval = setInterval(() => {
        holdTime += 50;
        updateProgress();
        cekTransisiTahap();
    }, 50);
}

function stopHolding() {
    const cakeContainer = document.querySelector('.cake-container');
    const tapHint = document.getElementById('tap-hint');

    if (cakeContainer) cakeContainer.classList.remove('holding');

    // Stop interval
    if (holdInterval) {
        clearInterval(holdInterval);
        holdInterval = null;
    }

    // Tampilkan hint untuk menekan lagi (jika belum selesai)
    if (holdCurrentStage > 0 && holdCurrentStage < 3 && tapHint) {
        tapHint.textContent = '🌬️ Tekan dan tahan lagi untuk melanjutkan';
        tapHint.className = 'tap-hint show-hint';
    }
}

function updateProgress() {
    const progressFill = document.getElementById('hold-progress-fill');
    if (!progressFill) return;

    const percent = Math.min((holdTime / STAGE_2_DURATION) * 100, 100);
    progressFill.style.width = percent + '%';
}

function cekTransisiTahap() {
    // Transisi dari tahap 1 ke tahap 2
    if (holdCurrentStage === 1 && holdTime >= STAGE_1_DURATION) {
        holdCurrentStage = 2;
        tampilkanTahap2();
    }

    // Transisi dari tahap 2 ke tahap 3 (selesai)
    if (holdCurrentStage === 2 && holdTime >= STAGE_2_DURATION) {
        holdCurrentStage = 3;
        stopHolding();
        tampilkanTahap3();
    }
}

function tampilkanTahap1() {
    const msg = document.getElementById('candle-message');
    const flames = document.querySelectorAll('.candle-flame');

    if (msg) {
        msg.textContent = 'Lilin mulai ditiup...';
        msg.className = 'candle-message show-msg';
    }

    // Api bergoyang lebih kencang tapi belum mati
    flames.forEach(flame => {
        flame.style.animationDuration = '0.15s';
    });
}

function tampilkanTahap2() {
    const msg = document.getElementById('candle-message');
    const flames = document.querySelectorAll('.candle-flame');

    if (msg) {
        msg.className = 'candle-message'; // fade out dulu
        setTimeout(() => {
            msg.textContent = 'Make a wish, Berdoa dulu yaa.. ';
            msg.className = 'candle-message show-msg';
        }, 400);
    }

    // Api mulai redup
    flames.forEach(flame => {
        flame.classList.add('dimming');
    });
}

function tampilkanTahap3() {
    const msg = document.getElementById('candle-message');
    const tapHint = document.getElementById('tap-hint');
    const flames = document.querySelectorAll('.candle-flame');
    const candlePage = document.getElementById('candle-page');
    const progressBar = document.getElementById('hold-progress-bar');

    // Sembunyikan hint & progress
    if (tapHint) {
        tapHint.textContent = '';
        tapHint.className = 'tap-hint';
    }
    if (progressBar) {
        setTimeout(() => { progressBar.classList.remove('show-bar'); }, 500);
    }

    // Fade out pesan sebelumnya
    if (msg) msg.className = 'candle-message';

    // Matikan api satu per satu
    flames.forEach((flame, index) => {
        setTimeout(() => {
            flame.classList.remove('dimming');
            flame.classList.add('extinguished');
        }, index * 400);
    });

    // Setelah semua api mati
    setTimeout(() => {
        buatConfetti();

        setTimeout(() => {
            if (msg) {
                msg.textContent = 'Semoga apa yang kamu doakan dan inginkan segera terlaksana yaa, Aamiin 🤍';
                msg.className = 'candle-message show-msg final-msg';
            }
        }, 600);
    }, flames.length * 400 + 500);

    // Hapus event listeners karena sudah selesai
    if (candlePage) hapusHoldListeners(candlePage);
}

function buatConfetti() {
    const colors = [
        '#ff6b81', '#ffb6c1', '#a55eea', '#6c5ce7', '#ffd700',
        '#ff9ff3', '#f368e0', '#ffffff', '#00d2d3', '#ff6348',
        '#7bed9f', '#ffa502', '#ff4757', '#2ed573', '#eccc68',
        '#ff7eb3', '#c56cf0', '#17c0eb', '#ffc312'
    ];
    const shapes = ['circle', 'rect', 'star', 'heart', 'ribbon'];
    const animStyles = ['', 'confetti-swirl', 'confetti-zigzag'];

    function burstWave(count, delayBase) {
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti-piece');

            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const animStyle = animStyles[Math.floor(Math.random() * animStyles.length)];
            const size = 5 + Math.random() * 10;

            if (animStyle) confetti.classList.add(animStyle);

            if (shape === 'star') {
                confetti.classList.add('confetti-star');
                confetti.textContent = '⭐';
                confetti.style.fontSize = (10 + Math.random() * 8) + 'px';
            } else if (shape === 'heart') {
                confetti.classList.add('confetti-heart');
                confetti.textContent = '💖';
                confetti.style.fontSize = (8 + Math.random() * 8) + 'px';
            } else if (shape === 'ribbon') {
                confetti.classList.add('confetti-ribbon');
                confetti.style.width = (3 + Math.random() * 4) + 'px';
                confetti.style.height = (14 + Math.random() * 12) + 'px';
                confetti.style.background = color;
                confetti.style.borderRadius = '1px';
            } else if (shape === 'rect') {
                confetti.style.width = size + 'px';
                confetti.style.height = (size * 0.5) + 'px';
                confetti.style.background = color;
                confetti.style.borderRadius = '2px';
            } else {
                confetti.style.width = size + 'px';
                confetti.style.height = size + 'px';
                confetti.style.background = color;
                confetti.style.borderRadius = '50%';
            }

            // Wider spread across the entire screen
            confetti.style.left = (5 + Math.random() * 90) + 'vw';
            confetti.style.top = '-15px';
            confetti.style.animationDuration = (2.5 + Math.random() * 3) + 's';
            confetti.style.animationDelay = (delayBase + Math.random() * 1.2) + 's';

            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 8000 + delayBase * 1000);
        }
    }

    const isMobileConfetti = window.innerWidth <= 768;
    // Gelombang 1: Ledakan utama
    burstWave(isMobileConfetti ? 28 : 60, 0);

    // Gelombang 2: Ledakan kedua setelah 0.8 detik
    setTimeout(() => burstWave(isMobileConfetti ? 22 : 50, 0), 800);

    // Gelombang 3: Hujan confetti lanjutan
    setTimeout(() => burstWave(isMobileConfetti ? 16 : 40, 0), 2000);
}
