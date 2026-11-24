/* ---------------------------------------------------------------
   PRITI'S COUNTDOWN — standalone, India-time-safe and always visible
   --------------------------------------------------------------- */
(() => {
    'use strict';
    const rootSelector = '[data-countdown-root]';
    const numberFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric'
    });
    const indiaParts = date => {
        const parts = numberFormatter.formatToParts(date);
        const values = {};
        for (const part of parts) if (part.type !== 'literal') values[part.type] = Number(part.value);
        return values;
    };
    // Midnight on 26 November in India is 18:30 UTC on 25 November.
    const indiaMidnightEpoch = (year, monthIndex, day) => Date.UTC(year, monthIndex, day - 1, 18, 30, 0, 0);
    const pad = value => String(value).padStart(2, '0');
    const update = () => {
        const roots = document.querySelectorAll(rootSelector);
        if (!roots.length) return;
        const now = new Date();
        const india = indiaParts(now);
        const birthdayToday = india.month === 11 && india.day === 26;
        let target = indiaMidnightEpoch(india.year, 10, 26);
        if (!birthdayToday && now.getTime() >= target) target = indiaMidnightEpoch(india.year + 1, 10, 26);
        const secondsLeft = birthdayToday ? 0 : Math.max(0, Math.floor((target - now.getTime()) / 1000));
        const values = {
            days: Math.floor(secondsLeft / 86400),
            hours: Math.floor((secondsLeft % 86400) / 3600),
            minutes: Math.floor((secondsLeft % 3600) / 60),
            seconds: secondsLeft % 60
        };
        roots.forEach(root => {
            root.querySelectorAll('[data-countdown-unit]').forEach(node => {
                const unit = node.getAttribute('data-countdown-unit');
                if (Object.prototype.hasOwnProperty.call(values, unit)) node.textContent = pad(values[unit]);
            });
            root.querySelectorAll('[data-countdown-message]').forEach(node => {
                node.textContent = birthdayToday ? 'the day is finally here, priti ♡' : 'counting down to your day';
            });
            root.classList.toggle('is-birthday-today', birthdayToday);
            root.setAttribute('data-countdown-state', birthdayToday ? 'birthday' : 'counting');
        });
    };
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
    window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
})();

/* ================================================================
   for priti — a birthday written in the stars
   interactive experience matched to index.html and style.css
   ================================================================ */
(() => {
    'use strict';

    /* ------------------------------------------------------------
       01. small utilities and shared state
       ------------------------------------------------------------ */

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const byId = id => document.getElementById(id);
    const reducedMotion = Boolean(
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    const setStatus = (id, message) => {
        const element = byId(id);
        if (element) element.textContent = message;
    };

    const showElement = element => {
        if (element) element.hidden = false;
    };

    const hideElement = element => {
        if (element) element.hidden = true;
    };

    const markMediaEmpty = (element, empty = true) => {
        if (!element) return;
        element.classList.toggle('is-empty', empty);
        element.classList.toggle('has-media', !empty);
    };

    let toastTimer = null;
    const toast = message => {
        const box = byId('website-toast');
        const label = byId('website-toast-message');
        if (!box || !label) return;

        label.textContent = message;
        box.hidden = false;
        box.classList.remove('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            box.hidden = true;
        }, 3200);
    };

    const downloadBlob = (blob, filename) => {
        if (!(blob instanceof Blob)) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    };

    const downloadText = (content, filename, type = 'text/plain;charset=utf-8') => {
        downloadBlob(new Blob([content], { type }), filename);
    };

    const sleep = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
    const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

    /* ------------------------------------------------------------
       02. loading screen and opening gift sequence
       ------------------------------------------------------------ */

    const loadingScreen = byId('loading-screen');
    const mainSite = byId('main-website');
    const celebration = byId('celebration-overlay');
    const giftButton = byId('open-gift-button');
    const whistleStage = byId('whistle-stage');

    let loadingHidden = false;
    let giftOpened = false;
    let celebrationStarted = false;
    let whistleInProgress = false;

    const hideLoading = () => {
        if (!loadingScreen || loadingHidden) return;
        loadingHidden = true;
        loadingScreen.classList.add('is-hidden');
        window.setTimeout(() => {
            loadingScreen.hidden = true;
        }, 700);
    };

    window.addEventListener('load', () => window.setTimeout(hideLoading, 300), { once: true });
    // Do not make the greeting wait for external font or image requests to finish.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.setTimeout(hideLoading, 420), { once: true });
    } else {
        window.setTimeout(hideLoading, 420);
    }
    window.setTimeout(hideLoading, 4200);

    giftButton?.addEventListener('click', () => {
        if (giftOpened) return;
        giftOpened = true;

        giftButton.classList.add('is-open', 'open');
        giftButton.setAttribute('aria-expanded', 'true');

        const instruction = byId('gift-instruction');
        if (instruction) instruction.textContent = 'your little surprise is ready ♡';

        if (whistleStage) {
            whistleStage.hidden = false;
            whistleStage.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'center'
            });
        }

        toast('a little surprise, made just for you ♡');
    });

    /* ------------------------------------------------------------
       03. fireworks canvas
       ------------------------------------------------------------ */

    const activeFireworks = new WeakMap();

    function launchFireworks(canvas, duration = 5200) {
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const previous = activeFireworks.get(canvas);
        if (previous) {
            window.cancelAnimationFrame(previous.frame);
            window.removeEventListener('resize', previous.resize);
            if (previous.timer) window.clearTimeout(previous.timer);
        }

        const colours = ['#f5c9dc', '#e6a3c0', '#ffffff', '#c77a9e', '#d9b5ee'];
        const particles = [];
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        let frameId = 0;
        let lastBurst = 0;
        let running = true;

        const resize = () => {
            const bounds = canvas.getBoundingClientRect();
            const width = Math.max(1, bounds.width);
            const height = Math.max(1, bounds.height);
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        const task = { frame: 0, resize, timer: null };

        const burst = () => {
            const bounds = canvas.getBoundingClientRect();
            const x = randomBetween(35, Math.max(36, bounds.width - 35));
            const y = randomBetween(30, Math.max(31, bounds.height * 0.58));
            const colour = colours[Math.floor(Math.random() * colours.length)];
            const count = reducedMotion ? 22 : 48;

            for (let index = 0; index < count; index += 1) {
                const angle = (Math.PI * 2 * index) / count;
                const speed = randomBetween(0.9, reducedMotion ? 2 : 3.5);
                particles.push({
                    x,
                    y,
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed,
                    life: randomBetween(48, 88),
                    maximumLife: 90,
                    colour,
                    size: randomBetween(1, 3)
                });
            }
        };

        const drawParticles = () => {
            const bounds = canvas.getBoundingClientRect();
            context.clearRect(0, 0, bounds.width, bounds.height);

            for (let index = particles.length - 1; index >= 0; index -= 1) {
                const particle = particles[index];
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityY += 0.024;
                particle.velocityX *= 0.992;
                particle.life -= 1;

                context.globalAlpha = Math.max(0, particle.life / particle.maximumLife);
                context.fillStyle = particle.colour;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                context.fill();

                if (particle.life <= 0) particles.splice(index, 1);
            }

            context.globalAlpha = 1;
        };

        const finish = () => {
            running = false;
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('resize', resize);
            context.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
            activeFireworks.delete(canvas);
        };

        resize();
        window.addEventListener('resize', resize);
        activeFireworks.set(canvas, task);

        if (reducedMotion) {
            burst();
            drawParticles();
            task.timer = window.setTimeout(finish, 1150);
            return;
        }

        const endAt = performance.now() + duration;
        const animate = now => {
            if (!running) return;

            if (now - lastBurst > 520 && now < endAt) {
                burst();
                lastBurst = now;
            }

            drawParticles();

            if (now < endAt || particles.length > 0) {
                frameId = window.requestAnimationFrame(animate);
                task.frame = frameId;
            } else {
                finish();
            }
        };

        frameId = window.requestAnimationFrame(animate);
        task.frame = frameId;
    }

    /* ------------------------------------------------------------
       03a. cinematic sky-shot fireworks — rising rockets + huge
       layered bursts for the final Cherry Grove celebration.
       This is purely a canvas visual effect, with no physical setup.
       ------------------------------------------------------------ */
    const activeSkyShows = new WeakMap();
    function launchSkyShow(canvas, duration = 9800) {
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        const previous = activeSkyShows.get(canvas);
        if (previous) {
            window.cancelAnimationFrame(previous.frame);
            window.removeEventListener('resize', previous.resize);
            if (previous.timer) window.clearTimeout(previous.timer);
        }
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const palette = [
            { h: 330, s: 92, l: 78 }, { h: 286, s: 88, l: 78 },
            { h: 42, s: 100, l: 75 }, { h: 195, s: 92, l: 76 },
            { h: 350, s: 94, l: 82 }, { h: 265, s: 90, l: 84 }
        ];
        const rockets = [];
        const sparks = [];
        let frame = 0;
        let running = true;
        let lastLaunch = -900;
        let startAt = 0;
        let finaleTriggered = false;
        let openingSalvoTriggered = false;
        let width = 1;
        let height = 1;
        const task = { frame: 0, resize: null, timer: null };
        const resize = () => {
            const bounds = canvas.getBoundingClientRect();
            width = Math.max(1, bounds.width);
            height = Math.max(1, bounds.height);
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };
        task.resize = resize;
        const chooseColour = () => palette[Math.floor(Math.random() * palette.length)];
        const launchRocket = (xOverride = null, mega = false) => {
            const x = xOverride === null ? randomBetween(width * .12, width * .88) : xOverride;
            const colour = chooseColour();
            rockets.push({
                x, y: height + 12, targetY: randomBetween(height * .10, height * .40),
                vx: randomBetween(-.38, .38), vy: -randomBetween(7.0, 9.2),
                colour, trail: [], mega, age: 0
            });
        };
        const explode = rocket => {
            const count = reducedMotion ? 22 : (rocket.mega ? 250 : 168);
            const colour = rocket.colour;
            const ring = Math.random() > .52;
            for (let index = 0; index < count; index += 1) {
                const angle = ring ? Math.PI * 2 * index / count : Math.random() * Math.PI * 2;
                const speed = ring ? randomBetween(2.7, 4.9) : Math.pow(Math.random(), .34) * (rocket.mega ? 8.0 : 6.2);
                const shade = Math.random() > .74 ? chooseColour() : colour;
                sparks.push({
                    x: rocket.x, y: rocket.y,
                    vx: Math.cos(angle) * speed + randomBetween(-.24, .24),
                    vy: Math.sin(angle) * speed + randomBetween(-.24, .24),
                    gravity: randomBetween(.026, .062), drag: randomBetween(.982, .992),
                    life: randomBetween(66, rocket.mega ? 130 : 104),
                    maxLife: rocket.mega ? 130 : 104,
                    size: randomBetween(1.55, rocket.mega ? 3.8 : 3.1),
                    hue: shade.h, saturation: shade.s, lightness: shade.l,
                    twinkle: Math.random() > .72
                });
            }
            // A few delicate falling willow sparks make the burst linger in the sky.
            if (!reducedMotion) {
                for (let index = 0; index < 24; index += 1) {
                    sparks.push({ x: rocket.x, y: rocket.y, vx: randomBetween(-1.7, 1.7), vy: randomBetween(.5, 2.4), gravity: .018, drag: .995, life: randomBetween(100, 150), maxLife: 150, size: randomBetween(.7, 1.5), hue: 42, saturation: 90, lightness: 86, twinkle: true });
                }
            }
        };
        const drawRocket = rocket => {
            rocket.trail.push({ x: rocket.x, y: rocket.y });
            if (rocket.trail.length > 11) rocket.trail.shift();
            context.save();
            context.strokeStyle = `hsla(${rocket.colour.h},${rocket.colour.s}%,${rocket.colour.l}%,.72)`;
            context.lineWidth = 2.2;
            context.beginPath();
            rocket.trail.forEach((point, index) => { if (index === 0) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y); });
            context.stroke();
            context.fillStyle = '#fff8f4';
            context.shadowColor = `hsl(${rocket.colour.h},${rocket.colour.s}%,${rocket.colour.l}%)`;
            context.shadowBlur = 17;
            context.beginPath();
            context.arc(rocket.x, rocket.y, rocket.mega ? 3.6 : 2.7, 0, Math.PI * 2);
            context.fill();
            context.restore();
        };
        const drawSparks = () => {
            for (let index = sparks.length - 1; index >= 0; index -= 1) {
                const spark = sparks[index];
                const previousX = spark.x;
                const previousY = spark.y;
                spark.x += spark.vx;
                spark.y += spark.vy;
                spark.vy += spark.gravity;
                spark.vx *= spark.drag;
                spark.vy *= spark.drag;
                spark.life -= 1;
                if (spark.life <= 0) { sparks.splice(index, 1); continue; }
                const fade = Math.max(0, spark.life / spark.maxLife);
                const flicker = spark.twinkle && Math.floor(spark.life) % 3 === 0 ? .58 : 1;
                context.globalAlpha = fade * flicker;
                context.fillStyle = `hsl(${spark.hue},${spark.saturation}%,${spark.lightness}%)`;
                context.strokeStyle = context.fillStyle;
                context.shadowColor = context.fillStyle;
                context.shadowBlur = spark.size * 6.5;
                context.lineWidth = Math.max(1, spark.size * .72);
                context.beginPath();
                context.moveTo(previousX, previousY);
                context.lineTo(spark.x, spark.y);
                context.stroke();
                context.beginPath();
                context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
                context.fill();
            }
            context.globalAlpha = 1;
            context.shadowBlur = 0;
        };
        const finish = () => {
            running = false;
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
            context.clearRect(0, 0, width, height);
            activeSkyShows.delete(canvas);
        };
        resize();
        window.addEventListener('resize', resize);
        activeSkyShows.set(canvas, task);
        if (reducedMotion) {
            launchRocket(width * .5, true);
            const rocket = rockets.pop();
            rocket.y = height * .36;
            explode(rocket);
            drawSparks();
            task.timer = window.setTimeout(finish, 950);
            return;
        }
        const animate = now => {
            if (!running) return;
            if (!startAt) startAt = now;
            const elapsed = now - startAt;
            context.clearRect(0, 0, width, height);
            if (!openingSalvoTriggered && elapsed < 180) {
                openingSalvoTriggered = true;
                launchRocket(width * .22, true);
                launchRocket(width * .50, true);
                launchRocket(width * .78, true);
                lastLaunch = now;
            } else if (elapsed < duration && now - lastLaunch > (elapsed > duration * .72 ? 190 : 390)) {
                launchRocket(null, elapsed > duration * .75 && Math.random() > .35);
                if (elapsed > duration * .70 && Math.random() > .30) launchRocket(randomBetween(width * .22, width * .78), true);
                lastLaunch = now;
            }
            if (elapsed > duration - 1850 && !finaleTriggered) {
                finaleTriggered = true;
                launchRocket(width * .27, true);
                launchRocket(width * .5, true);
                launchRocket(width * .73, true);
            }
            for (let index = rockets.length - 1; index >= 0; index -= 1) {
                const rocket = rockets[index];
                rocket.x += rocket.vx;
                rocket.y += rocket.vy;
                rocket.age += 1;
                drawRocket(rocket);
                if (rocket.y <= rocket.targetY || rocket.age > 100) {
                    explode(rocket);
                    rockets.splice(index, 1);
                }
            }
            drawSparks();
            if (elapsed < duration || rockets.length || sparks.length) {
                frame = window.requestAnimationFrame(animate);
                task.frame = frame;
            } else finish();
        };
        frame = window.requestAnimationFrame(animate);
        task.frame = frame;
    }

    function makeDecorativeBalloon(container, options = {}) {
        if (!container) return null;
        const balloon = document.createElement('span');
        balloon.className = options.className || 'ambient-balloon';
        balloon.setAttribute('aria-hidden', 'true');
        balloon.textContent = options.symbol || ['♡', '✧', 'ღ', '✦'][Math.floor(Math.random() * 4)];
        const palette = ['#e9a9c5', '#c98ab7', '#f0c5d7', '#b78abf', '#f2d6df', '#d99ab7'];
        balloon.style.left = `${randomBetween(2, 96)}%`;
        balloon.style.setProperty('--balloon-tint', palette[Math.floor(Math.random() * palette.length)]);
        balloon.style.setProperty('--balloon-size', `${randomBetween(0.72, 1.22).toFixed(2)}`);
        balloon.style.setProperty('--balloon-drift', `${randomBetween(-55, 55).toFixed(0)}px`);
        balloon.style.animationDuration = `${randomBetween(options.minDuration || 13, options.maxDuration || 23).toFixed(1)}s`;
        balloon.style.animationDelay = `${randomBetween(-3, 0).toFixed(1)}s`;
        container.appendChild(balloon);
        balloon.addEventListener('animationend', () => balloon.remove(), { once: true });
        window.setTimeout(() => balloon.remove(), 26000);
        return balloon;
    }

    function seedIntroAtmosphere() {
        const garden = byId('intro-balloon-garden');
        const petals = byId('intro-petal-garden');
        if (garden && !garden.dataset.seeded) {
            garden.dataset.seeded = 'true';
            for (let index = 0; index < 21; index += 1) {
                const balloon = makeDecorativeBalloon(garden, { minDuration: 14, maxDuration: 24 });
                if (balloon) balloon.style.animationDelay = `${randomBetween(-22, 0).toFixed(1)}s`;
            }
        }
        if (petals && !petals.dataset.seeded) {
            petals.dataset.seeded = 'true';
            for (let index = 0; index < 17; index += 1) {
                const petal = document.createElement('span');
                petal.className = 'intro-floating-petal';
                petal.setAttribute('aria-hidden', 'true');
                petal.textContent = ['✧', '·', '♡', '❀'][index % 4];
                petal.style.left = `${randomBetween(1, 98)}%`;
                petal.style.animationDuration = `${randomBetween(13, 24).toFixed(1)}s`;
                petal.style.animationDelay = `${randomBetween(-22, 0).toFixed(1)}s`;
                petals.appendChild(petal);
            }
        }
    }

    function createCelebrationBalloons() {
        const layer = byId('celebration-balloon-container');
        if (!layer) return;
        layer.replaceChildren();
        for (let index = 0; index < 30; index += 1) {
            const balloon = makeDecorativeBalloon(layer, {
                className: 'celebration-balloon', minDuration: 8, maxDuration: 15
            });
            if (balloon) {
                balloon.style.animationDelay = `${randomBetween(-13, 0).toFixed(1)}s`;
                balloon.style.left = `${(index * 3.5 + randomBetween(0, 7)) % 100}%`;
            }
        }
        // A second, smaller wave arrives after the birthday message appears.
        window.setTimeout(() => {
            if (!celebration?.hidden) {
                for (let index = 0; index < 12; index += 1) {
                    makeDecorativeBalloon(layer, { className: 'celebration-balloon', minDuration: 9, maxDuration: 16 });
                }
            }
        }, 1700);
    }

    async function playWhistle() {
        if (celebrationStarted || whistleInProgress) return;
        whistleInProgress = true;

        const status = byId('whistle-status');
        const button = byId('blow-whistle-button');
        const microphoneButton = byId('microphone-whistle-button');

        if (button) button.disabled = true;
        if (microphoneButton) microphoneButton.disabled = true;
        if (status) status.textContent = 'your surprise is opening... ♡';

        await sleep(900);

        celebrationStarted = true;
        window.clearTimeout(toastTimer);
        hideElement(byId('website-toast'));
        showElement(celebration);
        createCelebrationBalloons();
        launchFireworks(byId('fireworks-canvas'), 6500);

        if (status) status.textContent = 'happy birthday, priti ♡';
        if (button) button.disabled = false;
        if (microphoneButton) microphoneButton.disabled = false;
    }

    byId('blow-whistle-button')?.addEventListener('click', playWhistle);

    /* ------------------------------------------------------------
       04. optional microphone detection for the whistle and candles
       ------------------------------------------------------------ */

    async function listenForSound({
        button,
        statusId,
        mode,
        timeoutMessage,
        onDetected,
        timeoutMilliseconds = 8500
    }) {
        if (!button || button.disabled) return;

        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus(statusId, 'microphone is not available here — use the button instead');
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            setStatus(statusId, 'microphone sound detection is not supported here — use the button instead');
            return;
        }

        let stream = null;
        let audioContext = null;
        let animationFrame = 0;
        let active = true;
        let consecutiveHits = 0;
        let cleanedUp = false;

        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            active = false;
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch(() => {});
            }
            button.disabled = false;
        };

        button.disabled = true;

        try {
            setStatus(
                statusId,
                mode === 'whistle'
                    ? 'listening for your little whistle...'
                    : 'listening... blow gently towards your microphone'
            );

            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new AudioContextClass();
            await audioContext.resume().catch(() => {});

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            audioContext.createMediaStreamSource(stream).connect(analyser);

            const samples = new Uint8Array(analyser.frequencyBinCount);
            const startedAt = performance.now();

            const measureSound = () => {
                if (mode === 'whistle') {
                    analyser.getByteFrequencyData(samples);
                    let total = 0;
                    let count = 0;
                    const firstBin = Math.floor(samples.length * 0.045);
                    const lastBin = Math.floor(samples.length * 0.22);

                    for (let index = firstBin; index < lastBin; index += 1) {
                        total += samples[index];
                        count += 1;
                    }

                    return count ? total / count : 0;
                }

                analyser.getByteTimeDomainData(samples);
                let total = 0;
                for (const sample of samples) total += Math.abs(sample - 128);
                return total / samples.length;
            };

            const threshold = mode === 'whistle' ? 17 : 10.5;
            const check = () => {
                if (!active) return;

                if (document.hidden) {
                    cleanup();
                    setStatus(statusId, 'microphone check paused — tap the button again or use the button below');
                    return;
                }

                if (measureSound() >= threshold) consecutiveHits += 1;
                else consecutiveHits = Math.max(0, consecutiveHits - 1);

                if (consecutiveHits >= 3) {
                    cleanup();
                    onDetected();
                    return;
                }

                if (performance.now() - startedAt >= timeoutMilliseconds) {
                    cleanup();
                    setStatus(statusId, timeoutMessage);
                    return;
                }

                animationFrame = window.requestAnimationFrame(check);
            };

            animationFrame = window.requestAnimationFrame(check);
        } catch (error) {
            cleanup();
            const message = error?.name === 'NotAllowedError'
                ? 'microphone permission was not granted — use the button instead'
                : 'could not access the microphone — use the button instead';
            setStatus(statusId, message);
        }
    }

    byId('microphone-whistle-button')?.addEventListener('click', event => {
        listenForSound({
            button: event.currentTarget,
            statusId: 'whistle-status',
            mode: 'whistle',
            timeoutMilliseconds: 9000,
            timeoutMessage: 'we did not catch a whistle — tap the blow whistle button instead',
            onDetected: playWhistle
        });
    });

    /* The opening and hero countdowns are synchronized by the standalone engine above. */

    byId('continue-to-website-button')?.addEventListener('click', () => {
        hideElement(celebration);
        showElement(mainSite);
        hideLoading();
        byId('home')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        startFloatingBalloons();
        updateScrollUI();
    });

    /* ------------------------------------------------------------
       05. navigation, mobile menu and scroll states
       ------------------------------------------------------------ */

    const menuButton = byId('mobile-menu-toggle');
    const navigation = byId('main-navigation');
    const topButton = byId('back-to-top-button');

    const closeNavigation = () => {
        menuButton?.setAttribute('aria-expanded', 'false');
        menuButton?.setAttribute('aria-label', 'open navigation menu');
        navigation?.classList.remove('is-open', 'open');
    };

    menuButton?.addEventListener('click', () => {
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'close navigation menu' : 'open navigation menu');
        navigation?.classList.toggle('is-open', open);
        navigation?.classList.toggle('open', open);
    });

    $$('.navigation-link, .site-logo').forEach(link => {
        link.addEventListener('click', closeNavigation);
    });

    function updateScrollUI() {
        topButton?.classList.toggle('is-visible', window.scrollY > 550);
    }

    window.addEventListener('scroll', updateScrollUI, { passive: true });
    updateScrollUI();

    const navigationSections = ['home', 'memories', 'videos', 'starlight-game', 'birthday-letter', 'birthday-celebration', 'little-studio']
        .map(byId)
        .filter(Boolean);

    /* Four explored chapters unlock a final note. It is optional and can be replayed. */
    const secretMilestones = new Set(['memories', 'videos', 'birthday-letter', 'birthday-celebration']);
    const visitedMilestones = new Set();
    const secretTrigger = byId('secret-star-trigger');
    const secretButton = byId('secret-star-button');
    const secretOverlay = byId('secret-surprise-overlay');
    const secretCloseButton = byId('secret-surprise-close');
    const secretFinishButton = byId('secret-surprise-finish');
    const secretLines = $$('.secret-note-line', secretOverlay || document);
    let secretIsUnlocked = false;
    let secretReturnFocus = null;
    let secretRevealTimers = [];
    let secretCloseTimer = null;

    const markMilestoneVisited = id => {
        if (!secretMilestones.has(id) || visitedMilestones.has(id)) return;
        visitedMilestones.add(id);
        if (!secretIsUnlocked && visitedMilestones.size === secretMilestones.size) {
            secretIsUnlocked = true;
            showElement(secretTrigger);
            secretTrigger?.classList.add('is-unlocked');
            toast('you found all four little stars — one last surprise has appeared ✨');
        }
    };

    const openSecretSurprise = () => {
        if (!secretIsUnlocked || !secretOverlay) return;
        secretReturnFocus = document.activeElement;
        window.clearTimeout(secretCloseTimer);
        secretRevealTimers.forEach(window.clearTimeout);
        secretRevealTimers = [];
        secretLines.forEach(line => line.classList.remove('is-visible'));
        secretOverlay.hidden = false;
        secretOverlay.classList.remove('is-visible');
        window.requestAnimationFrame(() => secretOverlay.classList.add('is-visible'));
        secretLines.forEach((line, index) => {
            const delay = reducedMotion ? 0 : 520 + index * 760;
            secretRevealTimers.push(window.setTimeout(() => line.classList.add('is-visible'), delay));
        });
        secretCloseButton?.focus();
    };

    const closeSecretSurprise = () => {
        if (!secretOverlay || secretOverlay.hidden) return;
        secretOverlay.classList.remove('is-visible');
        window.clearTimeout(secretCloseTimer);
        secretCloseTimer = window.setTimeout(() => { secretOverlay.hidden = true; }, reducedMotion ? 0 : 240);
        secretRevealTimers.forEach(window.clearTimeout);
        secretRevealTimers = [];
        if (secretReturnFocus && typeof secretReturnFocus.focus === 'function') secretReturnFocus.focus();
    };

    secretButton?.addEventListener('click', openSecretSurprise);
    secretCloseButton?.addEventListener('click', closeSecretSurprise);
    secretFinishButton?.addEventListener('click', closeSecretSurprise);
    secretOverlay?.addEventListener('click', event => {
        if (event.target === secretOverlay) closeSecretSurprise();
    });
    document.addEventListener('keydown', event => {
        if (!secretOverlay || secretOverlay.hidden) return;
        if (event.key === 'Escape') {
            closeSecretSurprise();
        } else if (event.key === 'Tab') {
            const focusable = $$('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])', secretOverlay)
                .filter(element => !element.hidden);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    if ('IntersectionObserver' in window && navigationSections.length) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                markMilestoneVisited(entry.target.id);
                const hash = `#${entry.target.id}`;
                $$('.navigation-link').forEach(link => {
                    const active = link.getAttribute('href') === hash;
                    link.classList.toggle('active', active);
                    if (active) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-28% 0px -58% 0px', threshold: 0 });

        navigationSections.forEach(section => sectionObserver.observe(section));
    } else {
        const checkVisibleMilestones = () => {
            secretMilestones.forEach(id => {
                const section = byId(id);
                if (!section) return;
                const bounds = section.getBoundingClientRect();
                if (bounds.top < window.innerHeight * 0.72 && bounds.bottom > window.innerHeight * 0.24) {
                    markMilestoneVisited(id);
                }
            });
        };
        window.addEventListener('scroll', checkVisibleMilestones, { passive: true });
        checkVisibleMilestones();
    }



    /* ------------------------------------------------------------
       05a. ambient artwork — each chapter receives its own backdrop
       ------------------------------------------------------------ */
    const ambientScenes = {
        home: 'rose-moonlight.jpg',
        memories: 'pearl-galaxy.jpg',
        videos: 'blush-comets.jpg',
        'starlight-game': 'starlight-garden.jpg',
        'birthday-letter': 'lavender-dream.jpg',
        'make-a-wish': 'orchid-night.jpg',
        'birthday-celebration': 'rose-gold-dawn.jpg',
        'little-studio': 'orchid-night.jpg',
        'final-message': 'starlight-finale.jpg'
    };
    const ambientLayers = [byId('ambient-scene-a'), byId('ambient-scene-b')].filter(Boolean);
    let activeAmbientLayer = ambientLayers.findIndex(layer => layer.classList.contains('is-active'));
    let currentAmbientScene = 'rose-moonlight.jpg';
    const setAmbientScene = file => {
        if (!file || file === currentAmbientScene || ambientLayers.length < 2) return;
        const nextIndex = activeAmbientLayer === 0 ? 1 : 0;
        const nextLayer = ambientLayers[nextIndex];
        const activate = () => {
            nextLayer.classList.add('is-active');
            ambientLayers[activeAmbientLayer]?.classList.remove('is-active');
            activeAmbientLayer = nextIndex;
            currentAmbientScene = file;
        };
        nextLayer.onload = activate;
        nextLayer.onerror = () => { nextLayer.onload = null; };
        if (nextLayer.getAttribute('src') === `assets/images/${file}` && nextLayer.complete && nextLayer.naturalWidth > 0) {
            activate();
        } else {
            nextLayer.src = `assets/images/${file}`;
        }
    };
    if ('IntersectionObserver' in window) {
        const ambientObserver = new IntersectionObserver(entries => {
            const visible = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setAmbientScene(ambientScenes[visible.target.id]);
        }, { rootMargin: '-18% 0px -48% 0px', threshold: [0, .12, .28, .5] });
        Object.keys(ambientScenes).forEach(id => {
            const section = byId(id);
            if (section) ambientObserver.observe(section);
        });
    }

    /* ------------------------------------------------------------
       05aa. birthday realm adventure — companion, End portal, dragon
       star-trial and cherry-grove sky-shot finale
       ------------------------------------------------------------ */
    const relicStorageKey = 'priti-overworld-relics-v1';
    const relicNames = { diamond: 'Diamond', 'golden-apple': 'Golden Apple', 'ender-pearl': 'Ender Pearl', cake: 'Birthday Cake' };
    const relicIcons = { diamond: '◇', 'golden-apple': '✿', 'ender-pearl': '◉', cake: '▰' };
    const relicButtons = $$('[data-relic]');
    const questToggle = byId('minecraft-quest-toggle');
    const questPopover = byId('minecraft-quest-popover');
    const questCount = byId('minecraft-quest-count');
    const questProgressCopy = byId('minecraft-quest-progress-copy');
    const questPortalButton = byId('minecraft-quest-portal-button');
    const questSlots = $$('[data-quest-slot]');
    const realmOverlay = byId('minecraft-realm-overlay');
    const realmClose = byId('minecraft-realm-close');
    const realmStages = $$('[data-mc-stage]');
    const adventureChapter = byId('mc-adventure-chapter');
    const adventureProgressFill = byId('mc-adventure-progress-fill');
    const petDogButton = byId('mc-pet-dog');
    const dogContinueButton = byId('mc-overworld-continue');
    const dogStatus = byId('mc-dog-status');
    const endPortalButton = byId('mc-activate-end-portal');
    const crystalButtons = $$('[data-dragon-crystal]');
    const dragonProgressLabel = byId('mc-dragon-progress-label');
    const dragonProgressFill = byId('mc-dragon-progress-fill');
    const dragonDefeatButton = byId('mc-defeat-dragon');
    const dragonStoryTitle = byId('mc-dragon-story-title');
    const dragonStoryCopy = byId('mc-dragon-story-copy');
    const dragonStatus = byId('mc-dragon-status');
    const dragonFlash = byId('mc-end-defeat-flash');
    const skyshowButton = byId('mc-launch-skyshow');
    const groveCakeButton = byId('mc-craft-grove-cake');
    const groveCakeReward = byId('mc-grove-cake-reward');
    const groveStatus = byId('mc-grove-status');
    const openSideQuestsButton = byId('mc-open-side-quests');
    const arcadeBackButton = byId('mc-arcade-back');
    let collectedRelics = new Set();
    let realmReturnFocus = null;
    let dogHasJoined = false;
    let awakenedCrystals = new Set();
    let skyshowPlayed = false;
    try {
        const savedRelics = JSON.parse(window.localStorage.getItem(relicStorageKey) || '[]');
        if (Array.isArray(savedRelics)) collectedRelics = new Set(savedRelics.filter(item => Object.prototype.hasOwnProperty.call(relicNames, item)));
    } catch (_) { collectedRelics = new Set(); }

    const updateRelicUI = () => {
        const count = collectedRelics.size;
        if (questCount) questCount.textContent = `${count}/4`;
        if (questProgressCopy) questProgressCopy.textContent = `${count} of 4 relics found`;
        questSlots.forEach(slot => {
            const found = collectedRelics.has(slot.dataset.questSlot);
            slot.classList.toggle('is-found', found);
            slot.setAttribute('aria-label', found ? `${slot.dataset.questSlot} found` : `${slot.dataset.questSlot} undiscovered`);
        });
        relicButtons.forEach(button => {
            const found = collectedRelics.has(button.dataset.relic);
            button.classList.toggle('is-found', found);
            button.disabled = found;
            if (found) button.setAttribute('aria-label', `${relicNames[button.dataset.relic]} collected`);
        });
        if (questPortalButton) questPortalButton.hidden = count !== 4;
    };
    const saveRelics = () => {
        try { window.localStorage.setItem(relicStorageKey, JSON.stringify([...collectedRelics])); } catch (_) { /* local storage can be unavailable */ }
    };
    const showRealmStage = name => {
        realmStages.forEach(stage => {
            const active = stage.dataset.mcStage === name;
            stage.hidden = !active;
            stage.classList.toggle('is-active', active);
        });
        const meta = {
            overworld: ['01 / 06 · OVERWORLD', 17],
            portal: ['02 / 06 · MAGIC PORTAL', 34],
            'end-portal': ['03 / 06 · THE END PORTAL', 50],
            end: ['04 / 06 · THE END', 67],
            grove: ['05 / 06 · CHERRY GROVE', 84],
            arcade: ['06 / 06 · PIXEL ARCADE', 100]
        }[name];
        if (adventureChapter && meta) adventureChapter.textContent = meta[0];
        if (adventureProgressFill && meta) adventureProgressFill.style.width = `${meta[1]}%`;
        const card = $('.minecraft-adventure-card');
        if (card) card.scrollTop = 0;
    };
    const openRealm = () => {
        if (!realmOverlay || collectedRelics.size !== 4) return;
        realmReturnFocus = document.activeElement;
        if (questPopover) questPopover.hidden = true;
        questToggle?.setAttribute('aria-expanded', 'false');
        realmOverlay.hidden = false;
        realmOverlay.classList.add('is-visible');
        showRealmStage('overworld');
        realmClose?.focus();
    };
    const closeRealm = () => {
        if (!realmOverlay || realmOverlay.hidden) return;
        realmOverlay.classList.remove('is-visible');
        realmOverlay.hidden = true;
        if (realmReturnFocus && typeof realmReturnFocus.focus === 'function') realmReturnFocus.focus();
    };
    questToggle?.addEventListener('click', () => {
        const opening = questPopover?.hidden;
        if (questPopover) questPopover.hidden = !opening;
        questToggle.setAttribute('aria-expanded', String(Boolean(opening)));
    });
    questPortalButton?.addEventListener('click', openRealm);
    relicButtons.forEach(button => {
        button.addEventListener('click', () => {
            const relic = button.dataset.relic;
            if (!Object.prototype.hasOwnProperty.call(relicNames, relic) || collectedRelics.has(relic)) return;
            collectedRelics.add(relic);
            saveRelics();
            updateRelicUI();
            toast(`${relicNames[relic]} discovered ${relicIcons[relic]} — ${collectedRelics.size}/4 treasures`);
            if (collectedRelics.size === 4) {
                window.setTimeout(() => {
                    toast('four relics complete — a whole new adventure is waiting! ✨');
                    openRealm();
                }, 700);
            }
        });
    });
    petDogButton?.addEventListener('click', () => {
        if (dogHasJoined) return;
        dogHasJoined = true;
        byId('mc-dog')?.classList.add('is-loved');
        if (dogStatus) dogStatus.textContent = 'Pixel wags their tail, gives a happy little bark, and decides you are now best friends. Woof!';
        petDogButton.textContent = 'best friends forever ♡';
        petDogButton.disabled = true;
        if (dogContinueButton) dogContinueButton.disabled = false;
        toast('Pixel joined your adventure! 🐾');
    });
    dogContinueButton?.addEventListener('click', () => {
        if (!dogHasJoined) return;
        showRealmStage('portal');
        byId('mc-activate-end-portal')?.focus();
    });
    endPortalButton?.addEventListener('click', () => {
        const portal = $('.mc-magic-portal');
        portal?.classList.add('is-opening');
        setStatus('mc-portal-status', 'the portal is opening… Pixel is right beside you!');
        endPortalButton.disabled = true;
        window.setTimeout(() => {
            showRealmStage('end-portal');
            endPortalButton.disabled = false;
            byId('mc-enter-end-portal')?.focus();
            toast('the End Portal has been found! ✨');
        }, reducedMotion ? 80 : 1050);
    });
    byId('mc-enter-end-portal')?.addEventListener('click', () => {
        const portal = $('.mc-end-portal-surface');
        portal?.classList.add('is-opening');
        setStatus('mc-end-portal-status', 'The End Portal is carrying you into the stars… Pixel is right beside you!');
        const button = byId('mc-enter-end-portal');
        if (button) button.disabled = true;
        window.setTimeout(() => {
            showRealmStage('end');
            if (button) button.disabled = false;
            crystalButtons[0]?.focus();
            toast('dimension crossed: THE END ✨');
        }, reducedMotion ? 80 : 1150);
    });

    const updateDragonProgress = () => {
        const count = awakenedCrystals.size;
        if (dragonProgressLabel) dragonProgressLabel.textContent = `${count} / 5 crystals awakened`;
        if (dragonProgressFill) dragonProgressFill.style.width = `${count * 20}%`;
        if (dragonDefeatButton) dragonDefeatButton.hidden = count !== 5;
        if (dragonStatus) dragonStatus.textContent = count === 5 ? 'All five crystals are glowing. The dragon’s shield is ready to dissolve!' : `${5 - count} star crystal${5 - count === 1 ? '' : 's'} still to awaken.`;
        byId('mc-end-arena')?.classList.toggle('has-full-starlight', count === 5);
    };
    crystalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const number = Number(button.dataset.dragonCrystal);
            if (awakenedCrystals.has(number)) return;
            awakenedCrystals.add(number);
            button.classList.add('is-awake');
            button.setAttribute('aria-pressed', 'true');
            button.disabled = true;
            updateDragonProgress();
            toast(`star crystal ${number} awakened ✦`);
        });
    });
    dragonDefeatButton?.addEventListener('click', () => {
        if (awakenedCrystals.size !== 5) return;
        byId('mc-end-arena')?.classList.add('dragon-defeated');
        if (dragonFlash) dragonFlash.classList.add('is-flashing');
        if (dragonStoryTitle) dragonStoryTitle.textContent = 'the dragon becomes a sky full of stars';
        if (dragonStoryCopy) dragonStoryCopy.textContent = 'You did it! The Ender Dragon’s shield has turned into a sparkling trail. No one was hurt; your teamwork filled the whole End with light.';
        if (dragonStatus) dragonStatus.textContent = 'QUEST COMPLETE · THE WAY TO THE CHERRY GROVE IS OPEN!';
        dragonDefeatButton.disabled = true;
        dragonDefeatButton.textContent = 'the path is opening…';
        toast('achievement unlocked: LIGHT OF THE END ✨');
        window.setTimeout(() => {
            showRealmStage('grove');
            skyshowButton?.focus();
            toast('welcome to the Sweet Cherry Grove 🌸');
        }, reducedMotion ? 100 : 1700);
    });
    skyshowButton?.addEventListener('click', () => {
        const canvas = byId('mc-skyshow-canvas');
        if (!canvas) return;
        launchSkyShow(canvas, 10500);
        skyshowPlayed = true;
        skyshowButton.textContent = 'launch another sky show ↻';
        if (groveStatus) groveStatus.textContent = 'Look up! Sky-shots are rising, bursting into huge flowers of light, and scattering glitter across the cherry blossoms. ♡';
        toast('the birthday sky show has begun! ✨🎆');
    });
    groveCakeButton?.addEventListener('click', () => {
        if (!groveCakeReward) return;
        showElement(groveCakeReward);
        groveCakeButton.disabled = true;
        groveCakeButton.textContent = 'legendary cake unlocked ✓';
        if (groveStatus) groveStatus.textContent = skyshowPlayed ? 'The sky is sparkling and the birthday cake is ready. Perfect.' : 'The birthday cake is ready. The sky show button is waiting too!';
        launchSkyShow(byId('mc-skyshow-canvas'), 7200);
        toast('legendary item crafted: birthday cake ♡');
    });


    /* ------------------------------------------------------------
       05ac. Pixel's optional side-quest arcade
       ------------------------------------------------------------ */
    const completedArcadeQuests = new Set();
    const updateArcadeProgress = () => {
        const count = completedArcadeQuests.size;
        const countLabel = byId('mc-arcade-completed');
        const progressTrack = byId('mc-arcade-progress');
        const progressFill = byId('mc-arcade-progress-fill');
        if (countLabel) countLabel.textContent = String(count);
        if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(count));
        if (progressFill) progressFill.style.width = `${count * 25}%`;
        completedArcadeQuests.forEach(key => {
            const pill = $(`[data-arcade-quest="${key}"]`);
            const card = $(`[data-arcade-card="${key}"]`);
            pill?.classList.add('is-complete');
            if (pill && pill.dataset.done !== 'true') { pill.textContent = `${pill.textContent} ✓`; pill.dataset.done = 'true'; }
            card?.setAttribute('data-arcade-complete', 'true');
        });
    };
    const completeArcadeQuest = key => {
        if (completedArcadeQuests.has(key)) return;
        completedArcadeQuests.add(key);
        updateArcadeProgress();
        if (completedArcadeQuests.size === 4) toast("PIXEL'S ARCADE MASTER · all four little quests complete! ✨");
    };
    updateArcadeProgress();
    openSideQuestsButton?.addEventListener('click', () => {
        showRealmStage('arcade');
        initializeEndermanHunt();
        initializeJigsaw();
        quizIndex = 0;
        quizScore = 0;
        renderBirthdayQuiz();
        byId('mc-arcade-title')?.focus();
    });
    arcadeBackButton?.addEventListener('click', () => {
        showRealmStage('grove');
        openSideQuestsButton?.focus();
    });

    // The TNT crates are harmless enchanted confetti boxes. This is a rune-order puzzle only.
    const tntSequence = ['moon', 'paw', 'star'];
    let tntProgress = [];
    const tntRuneButtons = $$('#mc-tnt-runes [data-tnt-rune]');
    const tntReward = byId('mc-tnt-reward');
    const resetTntPuzzle = () => {
        tntProgress = [];
        tntRuneButtons.forEach(button => { button.disabled = false; button.classList.remove('is-correct'); });
        hideElement(tntReward);
        setStatus('mc-tnt-status', 'Rune code: 0 / 3');
    };
    tntRuneButtons.forEach(button => button.addEventListener('click', () => {
        if (tntProgress.length >= tntSequence.length) return;
        const chosen = button.dataset.tntRune;
        const expected = tntSequence[tntProgress.length];
        if (chosen !== expected) {
            tntProgress = [];
            tntRuneButtons.forEach(item => item.classList.remove('is-correct'));
            setStatus('mc-tnt-status', 'Not quite — the rune pattern has reset. Follow the moon, paw and star.');
            return;
        }
        tntProgress.push(chosen);
        button.classList.add('is-correct');
        setStatus('mc-tnt-status', `Rune code: ${tntProgress.length} / 3`);
        if (tntProgress.length === 3) {
            tntRuneButtons.forEach(item => { item.disabled = true; });
            showElement(tntReward);
            setStatus('mc-tnt-status', 'CONFETTI VAULT OPENED · PERFECT RUNE MEMORY!');
            completeArcadeQuest('tnt');
            toast('bonus quest complete: confetti vault ✨');
        }
    }));
    byId('mc-tnt-reset')?.addEventListener('click', resetTntPuzzle);

    // Find three friendly Endermen hidden among six blossom glades.
    const endermanGrid = byId('mc-enderman-grid');
    const endermanButtons = endermanGrid ? $$('[data-enderman-spot]', endermanGrid) : [];
    let endermanLocations = new Set();
    let endermanFound = new Set();
    let endermanInitialized = false;
    const initializeEndermanHunt = () => {
        if (!endermanGrid) return;
        const order = [0,1,2,3,4,5];
        for (let i = order.length - 1; i > 0; i--) {
            const swap = Math.floor(Math.random() * (i + 1));
            [order[i], order[swap]] = [order[swap], order[i]];
        }
        endermanLocations = new Set(order.slice(0,3));
        endermanFound = new Set();
        endermanButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('is-found','is-empty');
            button.textContent = '✧';
            button.setAttribute('aria-pressed','false');
        });
        hideElement(byId('mc-enderman-reward'));
        setStatus('mc-enderman-status', 'Endermen found: 0 / 3');
        endermanInitialized = true;
    };
    endermanButtons.forEach(button => button.addEventListener('click', () => {
        const spot = Number(button.dataset.endermanSpot);
        if (button.disabled || endermanFound.has(spot)) return;
        button.disabled = true;
        if (endermanLocations.has(spot)) {
            endermanFound.add(spot);
            button.classList.add('is-found');
            button.textContent = '';
            button.setAttribute('aria-label', `Enderman found at spot ${spot + 1}`);
            setStatus('mc-enderman-status', `Endermen found: ${endermanFound.size} / 3`);
            if (endermanFound.size === 3) {
                showElement(byId('mc-enderman-reward'));
                setStatus('mc-enderman-status', 'ALL THREE FOUND · THEY LEFT A PEARL FOR YOU!');
                completeArcadeQuest('enderman');
                toast('bonus quest complete: Enderman hide & seek ◉');
            }
        } else {
            button.classList.add('is-empty');
            button.textContent = '🌸';
            button.setAttribute('aria-label', `blossom found at spot ${spot + 1}`);
        }
    }));
    byId('mc-enderman-reset')?.addEventListener('click', initializeEndermanHunt);

    // A solvable 3×3 sliding puzzle. The board is scrambled only by legal moves.
    const jigsawBoardElement = byId('mc-jigsaw-board');
    const jigsawMovesLabel = byId('mc-jigsaw-moves');
    let jigsawBoard = [];
    let jigsawMoves = 0;
    const jigsawSolved = [1,2,3,4,5,6,7,8,0];
    const jigsawAdjacent = (a,b) => {
        const ar = Math.floor(a / 3), ac = a % 3, br = Math.floor(b / 3), bc = b % 3;
        return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
    };
    const renderJigsaw = () => {
        if (!jigsawBoardElement) return;
        jigsawBoardElement.innerHTML = '';
        jigsawBoard.forEach((tile,index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `mc-jigsaw-tile${tile === 0 ? ' is-empty' : ''}`;
            button.dataset.jigsawIndex = String(index);
            if (tile === 0) {
                button.disabled = true;
                button.setAttribute('aria-label','empty puzzle space');
                button.textContent = '✧';
            } else {
                const sourceIndex = tile - 1;
                const row = Math.floor(sourceIndex / 3), col = sourceIndex % 3;
                button.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
                button.setAttribute('aria-label',`picture tile ${tile}; tap to slide`);
            }
            jigsawBoardElement.appendChild(button);
        });
        if (jigsawMovesLabel) jigsawMovesLabel.textContent = `Moves: ${jigsawMoves}`;
    };
    const initializeJigsaw = () => {
        jigsawBoard = [...jigsawSolved];
        let previousEmpty = -1;
        for (let step = 0; step < 46; step++) {
            const empty = jigsawBoard.indexOf(0);
            const choices = [empty-3,empty+3,empty-1,empty+1].filter(index => index >= 0 && index < 9 && jigsawAdjacent(empty,index) && index !== previousEmpty);
            const pick = choices[Math.floor(Math.random() * choices.length)];
            [jigsawBoard[empty],jigsawBoard[pick]] = [jigsawBoard[pick],jigsawBoard[empty]];
            previousEmpty = empty;
        }
        if (jigsawBoard.every((value,index) => value === jigsawSolved[index])) {
            const empty = jigsawBoard.indexOf(0); const pick = empty === 8 ? 7 : 8;
            [jigsawBoard[empty],jigsawBoard[pick]] = [jigsawBoard[pick],jigsawBoard[empty]];
        }
        jigsawMoves = 0;
        hideElement(byId('mc-jigsaw-reward'));
        setStatus('mc-jigsaw-status','A little patience, and Pixel’s portrait will be whole.');
        renderJigsaw();
    };
    jigsawBoardElement?.addEventListener('click', event => {
        const button = event.target.closest('[data-jigsaw-index]');
        if (!button) return;
        const index = Number(button.dataset.jigsawIndex);
        const empty = jigsawBoard.indexOf(0);
        if (!jigsawAdjacent(index,empty)) {
            setStatus('mc-jigsaw-status','Choose a tile directly beside the empty sparkle.');
            return;
        }
        [jigsawBoard[index],jigsawBoard[empty]] = [jigsawBoard[empty],jigsawBoard[index]];
        jigsawMoves++;
        renderJigsaw();
        if (jigsawBoard.every((value,i) => value === jigsawSolved[i])) {
            showElement(byId('mc-jigsaw-reward'));
            setStatus('mc-jigsaw-status',`PICTURE COMPLETE · solved in ${jigsawMoves} moves!`);
            completeArcadeQuest('jigsaw');
            toast('bonus quest complete: Pixel’s portrait ♡');
        }
    });
    byId('mc-jigsaw-shuffle')?.addEventListener('click', initializeJigsaw);

    // Lighthearted yes/no birthday quiz, with explicit feedback and replay.
    const birthdayQuiz = [
        { question: 'Should Pixel get a tiny birthday bow?', answer: 'yes', right: 'Absolutely. Pixel is now officially party-ready. 🐾' },
        { question: 'Is a golden apple a legendary birthday snack?', answer: 'yes', right: 'Correct — a golden snack for a golden day.' },
        { question: 'Should an Enderman borrow the cake without asking?', answer: 'no', right: 'Exactly. Even Endermen need good birthday manners.' },
        { question: 'Does a Cherry Grove deserve a sky full of fireworks?', answer: 'yes', right: 'Yes indeed. Let the whole sky celebrate.' },
        { question: 'Is Priti the star of this birthday universe?', answer: 'yes', right: 'Always the birthday star. You earned the champion title. ♡' }
    ];
    let quizIndex = 0;
    let quizScore = 0;
    let quizAnswered = false;
    const quizAnswerButtons = $$('[data-quiz-answer]');
    const renderBirthdayQuiz = () => {
        const current = birthdayQuiz[quizIndex];
        if (!current) return;
        setStatus('mc-quiz-count',`QUESTION ${quizIndex + 1} / ${birthdayQuiz.length}`);
        setStatus('mc-quiz-question',current.question);
        setStatus('mc-quiz-feedback','Trust your birthday instincts.');
        quizAnswered = false;
        quizAnswerButtons.forEach(button => { button.disabled = false; button.classList.remove('is-selected'); });
        hideElement(byId('mc-quiz-next'));
        hideElement(byId('mc-quiz-restart'));
    };
    quizAnswerButtons.forEach(button => button.addEventListener('click', () => {
        if (quizAnswered) return;
        quizAnswered = true;
        const current = birthdayQuiz[quizIndex];
        const choice = button.dataset.quizAnswer;
        const isRight = choice === current.answer;
        if (isRight) quizScore++;
        quizAnswerButtons.forEach(item => { item.disabled = true; item.classList.toggle('is-selected', item === button); });
        setStatus('mc-quiz-feedback', isRight ? `✓ ${current.right}` : `Not quite — ${current.right}`);
        showElement(byId('mc-quiz-next'));
        byId('mc-quiz-next').textContent = quizIndex === birthdayQuiz.length - 1 ? 'see my birthday verdict →' : 'next question →';
    }));
    byId('mc-quiz-next')?.addEventListener('click', () => {
        if (quizIndex < birthdayQuiz.length - 1) {
            quizIndex++;
            renderBirthdayQuiz();
            return;
        }
        setStatus('mc-quiz-count','YOUR BIRTHDAY VERDICT');
        setStatus('mc-quiz-question',quizScore === 5 ? 'Cherry Grove Champion!' : 'Birthday Realm Explorer!');
        setStatus('mc-quiz-feedback',`You got ${quizScore} out of ${birthdayQuiz.length}. Every answer made this little world brighter. ♡`);
        completeArcadeQuest('quiz');
        hideElement(byId('mc-quiz-next'));
        showElement(byId('mc-quiz-restart'));
    });
    byId('mc-quiz-restart')?.addEventListener('click', () => {
        quizIndex = 0; quizScore = 0; renderBirthdayQuiz();
    });
    realmClose?.addEventListener('click', closeRealm);
    realmOverlay?.addEventListener('click', event => { if (event.target === realmOverlay) closeRealm(); });
    document.addEventListener('keydown', event => {
        if (realmOverlay && !realmOverlay.hidden && event.key === 'Escape') closeRealm();
    });
    updateRelicUI();

    /* ------------------------------------------------------------
       05ab. secret Creeper cameo — type CREEPER or tap the logo five times
       ------------------------------------------------------------ */
    const creeperSecret = byId('minecraft-creeper-secret');
    const creeperDismiss = byId('minecraft-creeper-dismiss');
    let creeperBuffer = '';
    let creeperHideTimer = null;
    let logoTapCount = 0;
    let logoTapTimer = null;
    const revealCreeper = () => {
        if (!creeperSecret) return;
        showElement(creeperSecret);
        window.clearTimeout(creeperHideTimer);
        creeperHideTimer = window.setTimeout(() => hideElement(creeperSecret), 5200);
        toast('a tiny green visitor has joined the birthday party');
    };
    document.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.target?.matches('input, textarea, select, [contenteditable="true"]')) return;
        creeperBuffer = (creeperBuffer + event.key.toLowerCase()).slice(-7);
        if (creeperBuffer === 'creeper') { creeperBuffer = ''; revealCreeper(); }
        if (realmOverlay && !realmOverlay.hidden && event.key === 'Escape') closeRealm();
        if (creeperSecret && !creeperSecret.hidden && event.key === 'Escape') hideElement(creeperSecret);
    });
    $('.site-logo')?.addEventListener('click', () => {
        logoTapCount += 1;
        window.clearTimeout(logoTapTimer);
        logoTapTimer = window.setTimeout(() => { logoTapCount = 0; }, 1400);
        if (logoTapCount >= 5) { logoTapCount = 0; revealCreeper(); }
    });
    creeperDismiss?.addEventListener('click', () => { window.clearTimeout(creeperHideTimer); hideElement(creeperSecret); });

    /* ------------------------------------------------------------
       05b. one-minute birthday mini-game — Catch the Starlight
       ------------------------------------------------------------ */

    const starlightGame = (() => {
        const playfield = byId('starlight-playfield');
        const targetLayer = byId('starlight-target-layer');
        const startButton = byId('starlight-start-button');
        const replayButton = byId('starlight-replay-button');
        const pauseButton = byId('starlight-pause-button');
        const readyOverlay = byId('starlight-ready-overlay');
        const resultOverlay = byId('starlight-result-overlay');
        if (!playfield || !targetLayer || !startButton || !pauseButton) return null;

        const GOAL = 26;
        const ROUND_MS = 60_000;
        const BEST_KEY = 'priti-starlight-best-v1';
        const ui = {
            time: byId('starlight-time'),
            score: byId('starlight-score'),
            streak: byId('starlight-streak'),
            best: byId('starlight-best'),
            progress: byId('starlight-progress'),
            progressFill: byId('starlight-progress-fill'),
            progressLabel: byId('starlight-progress-label'),
            status: byId('starlight-game-status'),
            skyName: byId('starlight-sky-name'),
            resultKicker: byId('starlight-result-kicker'),
            resultTitle: byId('starlight-result-title'),
            resultMessage: byId('starlight-result-message'),
            resultOrnament: byId('starlight-result-ornament')
        };

        const skies = [
            { file: 'starlight-garden.jpg', name: 'rose starlight garden' },
            { file: 'rose-moonlight.jpg', name: 'rose moonlight' },
            { file: 'lavender-dream.jpg', name: 'lavender dream' },
            { file: 'blush-comets.jpg', name: 'blush comet sky' },
            { file: 'pearl-galaxy.jpg', name: 'pearl galaxy' },
            { file: 'orchid-night.jpg', name: 'orchid midnight' },
            { file: 'rose-gold-dawn.jpg', name: 'rose-gold dawn' },
            { file: 'starlight-victory.jpg', name: 'the birthday constellation' }
        ];

        const state = {
            mode: 'ready',
            skyIndex: -1,
            score: 0,
            streak: 0,
            best: 0,
            remainingMs: ROUND_MS,
            deadline: 0,
            tickTimer: null,
            spawnTimer: null,
            targetTimers: new Set()
        };

        try {
            const saved = Number(window.localStorage.getItem(BEST_KEY));
            state.best = Number.isFinite(saved) && saved > 0 ? Math.min(999, saved) : 0;
        } catch (_) {
            state.best = 0;
        }

        const updateStats = () => {
            const seconds = Math.ceil(state.remainingMs / 1000);
            if (ui.time) ui.time.textContent = String(Math.max(0, seconds)).padStart(2, '0');
            if (ui.score) ui.score.textContent = String(state.score);
            if (ui.streak) ui.streak.textContent = String(state.streak);
            if (ui.best) ui.best.textContent = String(state.best);
            if (ui.progressLabel) ui.progressLabel.textContent = `${Math.min(state.score, GOAL)} / ${GOAL}`;
            if (ui.progressFill) ui.progressFill.style.width = `${Math.min(100, state.score / GOAL * 100)}%`;
            if (ui.progress) ui.progress.setAttribute('aria-valuenow', String(Math.min(GOAL, state.score)));
            playfield.classList.toggle('is-urgent', state.mode === 'playing' && seconds <= 10);
        };

        const setStatus = message => {
            if (ui.status) ui.status.textContent = message;
        };

        const clearTargetTimers = () => {
            state.targetTimers.forEach(timer => window.clearTimeout(timer));
            state.targetTimers.clear();
        };

        const clearTargets = () => {
            clearTargetTimers();
            targetLayer.replaceChildren();
        };

        const stopClocks = () => {
            window.clearInterval(state.tickTimer);
            window.clearInterval(state.spawnTimer);
            state.tickTimer = null;
            state.spawnTimer = null;
        };

        const saveBest = () => {
            if (state.score <= state.best) return;
            state.best = state.score;
            try { window.localStorage.setItem(BEST_KEY, String(state.best)); } catch (_) { /* private browsing can disable storage */ }
        };

        const updateResult = won => {
            if (ui.resultKicker) ui.resultKicker.textContent = won ? 'the sky is celebrating you' : 'a little more starlight next time';
            if (ui.resultTitle) ui.resultTitle.textContent = won ? 'you caught the starlight!' : 'the stars are still waiting';
            if (ui.resultMessage) {
                ui.resultMessage.textContent = won
                    ? `26 points, one beautiful minute, and a little sky gathered just for you, priti. happy birthday ♡`
                    : `you collected ${state.score} points this time. every try makes the next constellation brighter — give it another go ♡`;
            }
            if (ui.resultOrnament) ui.resultOrnament.textContent = won ? '✧ ♡ ✧' : '☾ ✧ ♡';
            showElement(resultOverlay);
            if (readyOverlay) hideElement(readyOverlay);
        };

        const finishRound = won => {
            if (state.mode !== 'playing' && state.mode !== 'paused') return;
            stopClocks();
            state.mode = won ? 'won' : 'finished';
            state.remainingMs = won ? state.remainingMs : 0;
            saveBest();
            updateStats();
            clearTargets();
            pauseButton.disabled = true;
            pauseButton.textContent = 'pause';
            updateResult(won);
            setStatus(won ? 'you did it — 26 little points for priti! ✨' : 'time is up — your little constellation is still lovely ♡');
            if (won) {
                playfield.classList.add('is-won');
                launchFireworks(byId('starlight-game-fireworks'), 3600);
                toast('you caught the starlight for priti ✨');
            } else {
                playfield.classList.remove('is-won');
            }
        };

        const removeTarget = target => {
            if (!target || !target.isConnected) return;
            target.classList.add('is-fading');
            window.setTimeout(() => target.remove(), reducedMotion ? 0 : 160);
        };

        const spawnTarget = () => {
            if (state.mode !== 'playing') return;
            const active = targetLayer.querySelectorAll('.starlight-target:not(.is-fading)');
            if (active.length >= 7) removeTarget(active[0]);

            const roll = Math.random();
            const kind = roll < 0.70 ? 'star' : roll < 0.91 ? 'heart' : 'cloud';
            const symbols = { star: '✦', heart: '♡', cloud: '☁' };
            const names = { star: 'golden star, one point', heart: 'bonus heart, three points', cloud: 'sleepy cloud, avoid this one' };
            const target = document.createElement('button');
            target.type = 'button';
            target.className = `starlight-target starlight-target-${kind}`;
            target.dataset.kind = kind;
            target.setAttribute('aria-label', names[kind]);
            target.textContent = symbols[kind];
            const left = randomBetween(9, 91);
            const top = randomBetween(20, 83);
            target.style.left = `${left}%`;
            target.style.top = `${top}%`;
            target.style.setProperty('--target-drift', `${randomBetween(-14, 14).toFixed(1)}px`);
            target.style.setProperty('--target-delay', `${randomBetween(0, 1.2).toFixed(2)}s`);
            targetLayer.appendChild(target);

            const timer = window.setTimeout(() => {
                state.targetTimers.delete(timer);
                if (target.isConnected) removeTarget(target);
            }, randomBetween(1700, 2350));
            state.targetTimers.add(timer);
        };

        const startClocks = () => {
            state.deadline = Date.now() + state.remainingMs;
            state.tickTimer = window.setInterval(() => {
                state.remainingMs = Math.max(0, state.deadline - Date.now());
                updateStats();
                if (state.remainingMs <= 0) finishRound(false);
            }, 100);
            state.spawnTimer = window.setInterval(spawnTarget, 620);
            spawnTarget();
        };

        const beginRound = () => {
            stopClocks();
            clearTargets();
            state.score = 0;
            state.streak = 0;
            state.remainingMs = ROUND_MS;
            state.mode = 'playing';
            state.skyIndex = (state.skyIndex + 1) % skies.length;
            const selectedSky = skies[state.skyIndex];
            const gameArt = $('.starlight-game-art', playfield);
            if (gameArt) gameArt.src = `assets/images/${selectedSky.file}`;
            if (ui.skyName) ui.skyName.textContent = selectedSky.name;
            playfield.classList.remove('is-won', 'is-urgent');
            hideElement(resultOverlay);
            hideElement(readyOverlay);
            pauseButton.disabled = false;
            pauseButton.textContent = 'pause';
            updateStats();
            setStatus('the sky is open — catch those little stars!');
            startClocks();
        };

        const togglePause = () => {
            if (state.mode === 'playing') {
                state.remainingMs = Math.max(0, state.deadline - Date.now());
                stopClocks();
                state.mode = 'paused';
                clearTargets();
                pauseButton.textContent = 'resume';
                setStatus('time paused — take a breath, then return to your little sky');
                updateStats();
                return;
            }
            if (state.mode === 'paused') {
                state.mode = 'playing';
                pauseButton.textContent = 'pause';
                setStatus('back to the stars — you have this!');
                startClocks();
            }
        };

        targetLayer.addEventListener('click', event => {
            const target = event.target.closest('.starlight-target');
            if (!target || state.mode !== 'playing' || !target.isConnected) return;
            const kind = target.dataset.kind;
            target.disabled = true;
            if (kind === 'cloud') {
                state.score = Math.max(0, state.score - 2);
                state.streak = 0;
                setStatus('oops, a sleepy cloud! minus 2 — find a golden star or heart ♡');
                target.classList.add('is-cloud-hit');
            } else {
                const points = kind === 'heart' ? 3 : 1;
                state.score += points;
                state.streak += 1;
                const combo = state.streak > 0 && state.streak % 5 === 0;
                if (combo) state.score += 2;
                setStatus(combo
                    ? `beautiful streak of ${state.streak}! a +2 constellation bonus ✨`
                    : kind === 'heart' ? '+3 bonus points — a little heart found you ♡' : '+1 point — keep gathering the stars ✦');
                target.classList.add('is-caught');
            }
            removeTarget(target);
            if (state.score > state.best) saveBest();
            updateStats();
            if (state.score >= GOAL) finishRound(true);
        });

        startButton.addEventListener('click', beginRound);
        replayButton?.addEventListener('click', beginRound);
        pauseButton.addEventListener('click', togglePause);
        updateStats();
        return { beginRound, getState: () => ({ mode: state.mode, score: state.score, best: state.best }) };
    })();

    /* ------------------------------------------------------------
       06. birthday music player
       ------------------------------------------------------------ */

    const audio = byId('birthday-audio');
    const playButton = byId('music-play-button');
    const progress = byId('music-progress-bar');
    const currentTimeLabel = byId('music-current-time');
    const durationLabel = byId('music-duration');
    const volume = byId('music-volume-bar');
    const musicPlayer = byId('floating-music-player');
    const musicContent = byId('music-player-content');
    const minimizeButton = byId('music-player-minimize');
    const musicCover = byId('music-cover-image');
    const musicAlbumArt = musicCover?.closest('.music-album-art');
    const syncMusicMinimized = minimized => {
        musicPlayer?.classList.toggle('is-minimized', minimized);
        if (musicContent) musicContent.hidden = minimized;
        if (minimizeButton) {
            minimizeButton.setAttribute('aria-expanded', String(!minimized));
            minimizeButton.setAttribute('aria-label', minimized ? 'expand music player' : 'minimize music player');
            minimizeButton.textContent = minimized ? '+' : '−';
        }
    };
    if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) syncMusicMinimized(true);
    const finaleTargets = [$('.final-message-section'), $('.site-footer')].filter(Boolean);
    if ('IntersectionObserver' in window && finaleTargets.length) {
        const finaleObserver = new IntersectionObserver(() => {
            const inFinale = finaleTargets.some(target => {
                const bounds = target.getBoundingClientRect();
                return bounds.bottom > 0 && bounds.top < window.innerHeight;
            });
            document.body.classList.toggle('is-finale-visible', inFinale);
            if (inFinale) syncMusicMinimized(true);
        }, { threshold: 0.06 });
        finaleTargets.forEach(target => finaleObserver.observe(target));
    }
    if (musicCover && musicAlbumArt) {
        musicAlbumArt.classList.add('is-empty');
        const syncMusicCover = () => markMediaEmpty(musicAlbumArt, !(musicCover.complete && musicCover.naturalWidth > 0));
        musicCover.addEventListener('load', syncMusicCover);
        musicCover.addEventListener('error', syncMusicCover);
        if (musicCover.complete) syncMusicCover();
    }

    const formatTime = seconds => {
        if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const updateMusicButton = playing => {
        if (playButton) {
            playButton.setAttribute('aria-pressed', String(playing));
            playButton.setAttribute('aria-label', playing ? 'pause birthday music' : 'play birthday music');

            const playIcon = $('.music-play-icon', playButton);
            const pauseIcon = $('.music-pause-icon', playButton);
            if (playIcon) playIcon.hidden = playing;
            if (pauseIcon) pauseIcon.hidden = !playing;
        }

        byId('music-vinyl-decoration')?.classList.toggle('is-playing', playing);
        musicPlayer?.classList.toggle('is-playing', playing);
    };

    const seekAudio = value => {
        if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
        audio.currentTime = (audio.duration * Number(value)) / 100;
    };

    playButton?.addEventListener('click', async () => {
        if (!audio) return;

        if (audio.paused) {
            try {
                await audio.play();
                updateMusicButton(true);
            } catch {
                toast('add your birthday-song.mp3 file to the music folder first');
                updateMusicButton(false);
            }
        } else {
            audio.pause();
            updateMusicButton(false);
        }
    });

    audio?.addEventListener('play', () => updateMusicButton(true));
    audio?.addEventListener('pause', () => updateMusicButton(false));
    audio?.addEventListener('ended', () => updateMusicButton(false));

    audio?.addEventListener('loadedmetadata', () => {
        if (durationLabel) durationLabel.textContent = formatTime(audio.duration);
        if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audio.currentTime);
    });

    audio?.addEventListener('timeupdate', () => {
        if (progress && Number.isFinite(audio.duration) && audio.duration > 0) {
            progress.value = String((audio.currentTime / audio.duration) * 100);
        }
        if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audio.currentTime);
    });

    audio?.addEventListener('error', () => {
        updateMusicButton(false);
        setStatus('music-track-title', 'your birthday song goes here');
        setStatus('music-track-artist', 'add birthday-song.mp3 to assets/music');
    });

    progress?.addEventListener('input', () => seekAudio(progress.value));

    if (audio && volume) {
        audio.volume = Math.min(1, Math.max(0, Number(volume.value)));
        volume.addEventListener('input', () => {
            audio.volume = Math.min(1, Math.max(0, Number(volume.value)));
        });
    }

    minimizeButton?.addEventListener('click', () => {
        const expanded = minimizeButton.getAttribute('aria-expanded') !== 'false';
        syncMusicMinimized(expanded);
    });

    // The supplied HTML contains one song, so previous and next restart that song.
    ['music-previous-button', 'music-next-button'].forEach(id => {
        const button = byId(id);
        if (button) {
            button.setAttribute('aria-label', 'restart birthday music');
            button.title = 'restart birthday music';
        }
        button?.addEventListener('click', async () => {
            if (!audio) return;
            try {
                audio.currentTime = 0;
                await audio.play();
            } catch {
                toast('add your birthday-song.mp3 file to assets/music first');
            }
        });
    });

    /* ------------------------------------------------------------
       07. floating compliment balloons
       ------------------------------------------------------------ */

    const compliments = [
        'you make ordinary moments feel special ♡',
        'your smile deserves its own sunshine',
        'you are a little piece of magic',
        'the world is brighter with you in it',
        'you deserve every beautiful thing coming your way',
        'never stop being wonderfully you',
        'your kindness is a kind of beauty',
        'you are more loved than words can say',
        'keep shining, birthday girl ✧',
        'you make memories worth keeping',
        'your laugh is a lovely little melody',
        'you are someone worth celebrating every day',
        'may your dreams always find their way to you',
        'you are beautiful in your own way ♡',
        'you bring warmth wherever you go',
        'there is nobody quite like you',
        'you deserve a day filled with little wonders',
        'your presence makes the ordinary feel golden',
        'may today be as lovely as your heart',
        'you are allowed to take up space and shine',
        'your story is still becoming something beautiful',
        'you make the world a softer place',
        'may every new chapter be kind to you',
        'you are a reason to celebrate today and always'
    ];

    const popup = byId('compliment-popup');
    const popupMessage = byId('compliment-popup-message');
    let balloonsStarted = false;
    let nextBalloonTimer = null;

    const showCompliment = () => {
        if (popupMessage) {
            popupMessage.textContent = compliments[Math.floor(Math.random() * compliments.length)];
        }
        if (popup) {
            popup.hidden = false;
            popup.classList.remove('is-visible');
            window.requestAnimationFrame(() => popup.classList.add('is-visible'));
        }
    };

    byId('compliment-close-button')?.addEventListener('click', () => hideElement(popup));

    function spawnFloatingBalloon() {
        const layer = byId('floating-balloon-layer');
        if (!layer || document.hidden) return;
        while (layer.children.length >= 34) layer.firstElementChild?.remove();

        const balloon = document.createElement('button');
        balloon.type = 'button';
        balloon.className = 'floating-balloon';
        balloon.setAttribute('aria-label', 'pop a balloon for a compliment');
        balloon.textContent = ['♡', '✧', 'ღ', '✦'][Math.floor(Math.random() * 4)];
        balloon.style.left = `${randomBetween(1, 97)}%`;
        balloon.style.setProperty('--balloon-tint', ['#e9a9c5', '#c98ab7', '#f0c5d7', '#b78abf', '#f2d6df'][Math.floor(Math.random() * 5)]);
        balloon.style.setProperty('--balloon-size', randomBetween(0.76, 1.24).toFixed(2));
        balloon.style.setProperty('--balloon-drift', `${randomBetween(-60, 60).toFixed(0)}px`);

        if (reducedMotion) {
            balloon.style.animation = 'none';
            balloon.style.bottom = `${randomBetween(18, 34)}%`;
        } else {
            balloon.style.animationDuration = `${randomBetween(12, 19)}s`;
        }

        balloon.addEventListener('click', () => {
            showCompliment();
            if (typeof balloon.animate === 'function' && !reducedMotion) {
                balloon.animate(
                    [
                        { opacity: 1, transform: 'scale(1)' },
                        { opacity: 0, transform: 'scale(1.35)' }
                    ],
                    { duration: 230, easing: 'ease-out', fill: 'forwards' }
                ).finished.finally(() => balloon.remove());
            } else {
                balloon.remove();
            }
        }, { once: true });

        balloon.addEventListener('animationend', () => balloon.remove(), { once: true });
        layer.appendChild(balloon);
        window.setTimeout(() => balloon.remove(), reducedMotion ? 7000 : 22000);
    }

    function scheduleNextBalloon() {
        if (!balloonsStarted || document.hidden) return;
        window.clearTimeout(nextBalloonTimer);
        nextBalloonTimer = window.setTimeout(() => {
            spawnFloatingBalloon();
            scheduleNextBalloon();
        }, reducedMotion ? 7000 : randomBetween(720, 1320));
    }

    function startFloatingBalloons() {
        if (balloonsStarted) return;
        balloonsStarted = true;

        for (let index = 0; index < 16; index += 1) {
            window.setTimeout(spawnFloatingBalloon, index * 180);
        }

        scheduleNextBalloon();
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            window.clearTimeout(nextBalloonTimer);
        } else if (balloonsStarted) {
            scheduleNextBalloon();
        }
    });

    /* ------------------------------------------------------------
       08. photograph lightbox and resilient image placeholders
       ------------------------------------------------------------ */

    const mediaImagePairs = [
        ...$$('.hero-main-photo').map(image => [image, image.closest('.hero-image-inner')]),
        ...$$('.memory-photo-border img').map(image => [image, image.closest('.memory-photo-border')]),
        ...$$('.birthday-feature-image').map(image => [image, image.closest('.birthday-feature-image-button')])
    ];

    mediaImagePairs.forEach(([image, wrapper]) => {
        if (!image || !wrapper) return;
        const syncImageState = () => {
            const loaded = image.complete && image.naturalWidth > 0;
            markMediaEmpty(wrapper, !loaded);
        };
        wrapper.classList.add('is-empty');
        image.addEventListener('load', syncImageState);
        image.addEventListener('error', syncImageState);
        if (image.complete) syncImageState();
    });

    const photoButtons = $$('[data-lightbox]');
    const getAvailablePhotoButtons = () => photoButtons.filter(button => {
        const image = $('img', button);
        return Boolean(image && image.complete && image.naturalWidth > 0 && button.dataset.lightbox);
    });
    let activePhotoButtons = [];
    const lightbox = byId('photo-lightbox');
    const lightboxImage = byId('lightbox-image');
    const lightboxCaption = byId('lightbox-caption');
    const lightboxCloseButton = byId('lightbox-close-button');
    let photoIndex = 0;
    let lastPhotoTrigger = null;
    let previousBodyOverflow = '';

    const showPhoto = index => {
        if (!activePhotoButtons.length || !lightboxImage) return;

        photoIndex = (index + activePhotoButtons.length) % activePhotoButtons.length;
        const button = activePhotoButtons[photoIndex];
        const image = $('img', button);
        if (!image) return;

        lightboxImage.src = button.dataset.lightbox;
        lightboxImage.alt = image.alt || `birthday memory ${photoIndex + 1}`;
        lightboxImage.parentElement?.classList.remove('is-empty');

        if (lightboxCaption) {
            const description = button.getAttribute('aria-label') || image.alt || 'a little memory';
            lightboxCaption.textContent = `${description} · ${String(photoIndex + 1).padStart(2, '0')} of ${String(activePhotoButtons.length).padStart(2, '0')}`;
        }
    };

    const openLightbox = button => {
        if (!lightbox) return;
        const clickedImage = $('img', button);
        if (!clickedImage || !clickedImage.complete || !clickedImage.naturalWidth) {
            toast(clickedImage?.complete ? 'this photograph is not in the photos folder yet' : 'this photograph is still loading — tap it again in a moment');
            return;
        }

        activePhotoButtons = getAvailablePhotoButtons();
        const selectedIndex = activePhotoButtons.indexOf(button);
        if (selectedIndex < 0) return;

        lastPhotoTrigger = document.activeElement;
        showPhoto(selectedIndex);
        lightbox.hidden = false;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        lightboxCloseButton?.focus();
    };

    const closeLightbox = () => {
        if (!lightbox || lightbox.hidden) return;
        lightbox.hidden = true;
        document.body.style.overflow = previousBodyOverflow;
        if (lastPhotoTrigger && typeof lastPhotoTrigger.focus === 'function') lastPhotoTrigger.focus();
    };

    photoButtons.forEach(button => {
        button.addEventListener('click', () => openLightbox(button));
    });

    lightboxCloseButton?.addEventListener('click', closeLightbox);
    lightboxImage?.addEventListener('error', () => {
        lightboxImage.parentElement?.classList.add('is-empty');
        if (lightboxCaption) lightboxCaption.textContent = 'add this photograph to assets/photos to view it here';
    });
    byId('lightbox-previous-button')?.addEventListener('click', () => showPhoto(photoIndex - 1));
    byId('lightbox-next-button')?.addEventListener('click', () => showPhoto(photoIndex + 1));

    lightbox?.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', event => {
        if (!lightbox || lightbox.hidden) return;

        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            showPhoto(photoIndex - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            showPhoto(photoIndex + 1);
        } else if (event.key === 'Tab') {
            const focusable = $$('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])', lightbox)
                .filter(element => !element.hidden);
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    /* ------------------------------------------------------------
       09. the three birthday videos
       ------------------------------------------------------------ */

    const videos = $$('.birthday-video');

    const pauseOtherVideos = activeVideo => {
        videos.forEach(video => {
            if (video !== activeVideo) video.pause();
        });
    };

    const syncVideoState = video => {
        const card = video.closest('.video-card');
        const frame = video.closest('.video-frame');
        const toggle = card ? $('[data-video-toggle]', card) : null;
        const playing = !video.paused && !video.ended;

        card?.classList.toggle('is-playing', playing);
        frame?.classList.toggle('is-playing', playing);

        if (toggle) {
            toggle.setAttribute('aria-label', playing ? 'pause birthday video' : 'play birthday video');
            toggle.setAttribute('aria-pressed', String(playing));
        }
    };

    $$('[data-video-toggle]').forEach(button => {
        button.addEventListener('click', async () => {
            const video = byId(button.dataset.videoToggle);
            if (!video) return;

            if (video.paused) {
                pauseOtherVideos(video);
                try {
                    await video.play();
                } catch {
                    markMediaEmpty(video.closest('.video-frame'), true);
                    markMediaEmpty(video.closest('.video-card'), true);
                    toast('add the matching video file inside assets/videos');
                }
            } else {
                video.pause();
            }
        });
    });

    videos.forEach(video => {
        const frame = video.closest('.video-frame');
        const card = video.closest('.video-card');
        const markVideoEmpty = () => {
            markMediaEmpty(frame, true);
            markMediaEmpty(card, true);
        };
        const markVideoReady = () => {
            markMediaEmpty(frame, false);
            markMediaEmpty(card, false);
        };

        ['play', 'pause', 'ended'].forEach(eventName => {
            video.addEventListener(eventName, () => syncVideoState(video));
        });
        video.addEventListener('loadedmetadata', markVideoReady);
        video.addEventListener('error', () => {
            markVideoEmpty();
            const placeholderText = frame ? $('.video-placeholder small', frame) : null;
            if (placeholderText) placeholderText.textContent = `add ${video.id}.mp4 to assets/videos`;
        });
        if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) markVideoEmpty();
    });

    $$('[data-video-restart]').forEach(button => {
        button.addEventListener('click', async () => {
            const video = byId(button.dataset.videoRestart);
            if (!video) return;

            pauseOtherVideos(video);
            try {
                video.currentTime = 0;
                await video.play();
            } catch {
                markMediaEmpty(video.closest('.video-frame'), true);
                markMediaEmpty(video.closest('.video-card'), true);
                toast('add the matching video file inside assets/videos');
            }
        });
    });

    $$('[data-video-fullscreen]').forEach(button => {
        button.addEventListener('click', async () => {
            const video = byId(button.dataset.videoFullscreen);
            if (!video) return;

            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else if (video.requestFullscreen) {
                    await video.requestFullscreen();
                } else if (video.webkitEnterFullscreen) {
                    video.webkitEnterFullscreen();
                } else {
                    toast('full screen is not available in this browser');
                }
            } catch {
                toast('full screen is not available in this browser');
            }
        });
    });

    /* ------------------------------------------------------------
       10. open the birthday letter envelope
       ------------------------------------------------------------ */

    byId('open-envelope-button')?.addEventListener('click', () => {
        const envelope = byId('birthday-envelope');
        const paper = byId('birthday-letter-paper');
        const button = byId('open-envelope-button');

        envelope?.classList.add('is-open', 'open');

        if (button) {
            button.disabled = true;
            button.textContent = 'your letter is open ♡';
            button.setAttribute('aria-expanded', 'true');
        }

        if (paper) {
            paper.hidden = false;
            paper.classList.add('is-visible');
            paper.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
                block: 'center'
            });
        }
    });

    /* ------------------------------------------------------------
       11. private birthday wish
       ------------------------------------------------------------ */

    byId('release-wish-button')?.addEventListener('click', () => {
        const confirmation = byId('wish-confirmation');
        showElement(confirmation);
        confirmation?.classList.add('is-visible');
        // Keep the typed wish visible; it stays in this page and is never uploaded.
        toast('your wish is yours to keep — may it come true ✧');
    });

    /* ------------------------------------------------------------
       12. candle blowing and cake cutting
       ------------------------------------------------------------ */

    const candleFlames = [
        'candle-flame-one',
        'candle-flame-two',
        'candle-flame-three',
        'candle-flame-four',
        'candle-flame-five'
    ].map(byId).filter(Boolean);

    const candleGroup = byId('birthday-candles');
    const cakeCuttingStage = byId('cake-cutting-stage');
    const cutCakeButton = byId('cut-cake-button');
    let candlesBlown = false;
    let cakeHasBeenCut = false;

    const releaseBirthdayBalloonShower = (count = 14) => {
        for (let index = 0; index < count; index += 1) {
            window.setTimeout(() => spawnFloatingBalloon(), index * 105);
        }
    };

    if (cutCakeButton) cutCakeButton.disabled = true;
    hideElement(cakeCuttingStage);

    const extinguishCandles = () => {
        if (candlesBlown) return;
        candlesBlown = true;

        candleGroup?.classList.add('candles-out');
        candleFlames.forEach((flame, index) => {
            window.setTimeout(() => {
                flame.classList.add('is-out');
                flame.closest('.birthday-candle')?.classList.add('is-blown-out');
            }, index * 145);
        });

        const microphoneButton = byId('blow-candles-microphone-button');
        const manualButton = byId('blow-candles-button');
        if (microphoneButton) microphoneButton.disabled = true;
        if (manualButton) manualButton.disabled = true;

        setStatus('candle-status-message', 'you did it — all your candles are out ♡');
        showElement(byId('candles-out-message'));
        showElement(cakeCuttingStage);
        cakeCuttingStage?.classList.add('is-visible');

        if (cutCakeButton) cutCakeButton.disabled = false;
        releaseBirthdayBalloonShower(12);
        toast('make a wish, birthday girl — look at all those wishes ✨');
    };

    byId('blow-candles-button')?.addEventListener('click', extinguishCandles);

    byId('blow-candles-microphone-button')?.addEventListener('click', event => {
        if (candlesBlown) return;
        listenForSound({
            button: event.currentTarget,
            statusId: 'candle-status-message',
            mode: 'blow',
            timeoutMilliseconds: 7500,
            timeoutMessage: 'we did not catch your blow — tap the blow out the candles button instead',
            onDetected: extinguishCandles
        });
    });

    cutCakeButton?.addEventListener('click', () => {
        if (!candlesBlown) {
            setStatus('cake-cutting-status', 'first, blow out all five candles ♡');
            return;
        }
        if (cakeHasBeenCut) return;
        cakeHasBeenCut = true;

        const visual = byId('cake-cutting-visual');
        const slice = visual ? $('.cake-slice-illustration', visual) : null;

        if (slice && typeof slice.animate === 'function' && !reducedMotion) {
            slice.animate(
                [
                    { transform: 'rotate(-4deg) translateX(0) translateY(0)' },
                    { transform: 'rotate(2deg) translateX(8px) translateY(-3px)' },
                    { transform: 'rotate(8deg) translateX(26px) translateY(-11px)' }
                ],
                {
                    duration: 850,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'forwards'
                }
            );
        }

        cutCakeButton.disabled = true;
        cutCakeButton.setAttribute('aria-label', 'cake cut with love');
        setStatus('cake-cutting-status', 'the cake is ready — happy birthday, priti!');
        showElement(byId('cake-cutting-celebration'));
        releaseBirthdayBalloonShower(20);
        toast('a whole sky of wishes, just for you ♡');
    });

    /* ------------------------------------------------------------
       13. drawing studio: brush, eraser, undo, redo and png download
       ------------------------------------------------------------ */

    const drawingCanvas = byId('birthday-drawing-canvas');

    if (drawingCanvas) {
        const drawingContext = drawingCanvas.getContext('2d', { willReadFrequently: true });
        const placeholder = byId('drawing-canvas-placeholder');
        const colourInput = byId('drawing-color');
        const sizeInput = byId('drawing-brush-size');
        const sizeOutput = byId('drawing-brush-size-value');
        const undoButton = byId('drawing-undo-button');
        const redoButton = byId('drawing-redo-button');

        if (drawingContext) {
            let drawing = false;
            let erasing = false;
            let lastPoint = null;
            let hasDrawing = false;
            let history = [];
            let historyIndex = -1;

            const updateHistoryButtons = () => {
                if (undoButton) undoButton.disabled = historyIndex <= 0;
                if (redoButton) redoButton.disabled = historyIndex < 0 || historyIndex >= history.length - 1;
            };

            const saveHistory = () => {
                try {
                    if (historyIndex < history.length - 1) {
                        history = history.slice(0, historyIndex + 1);
                    }

                    history.push({
                        image: drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
                        hasDrawing
                    });

                    if (history.length > 40) history.shift();
                    historyIndex = history.length - 1;
                    updateHistoryButtons();
                } catch {
                    setStatus('drawing-status-message', 'drawing history is unavailable in this browser');
                }
            };

            const restoreHistory = index => {
                const entry = history[index];
                if (!entry) return;

                drawingContext.putImageData(entry.image, 0, 0);
                historyIndex = index;
                hasDrawing = entry.hasDrawing;
                if (placeholder) placeholder.hidden = hasDrawing;
                updateHistoryButtons();
            };

            const pointFromEvent = event => {
                const bounds = drawingCanvas.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return null;

                return {
                    x: ((event.clientX - bounds.left) * drawingCanvas.width) / bounds.width,
                    y: ((event.clientY - bounds.top) * drawingCanvas.height) / bounds.height
                };
            };

            const startDrawing = event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;

                const point = pointFromEvent(event);
                if (!point) return;

                drawing = true;
                lastPoint = point;
                drawingCanvas.setPointerCapture?.(event.pointerId);

                drawingContext.beginPath();
                drawingContext.moveTo(point.x, point.y);
                drawingContext.lineCap = 'round';
                drawingContext.lineJoin = 'round';
                drawingContext.strokeStyle = colourInput?.value || '#e6a3c0';
                drawingContext.lineWidth = Number(sizeInput?.value || 5)
                    * (drawingCanvas.width / Math.max(1, drawingCanvas.getBoundingClientRect().width));
                drawingContext.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
                drawingContext.lineTo(point.x + 0.01, point.y + 0.01);
                drawingContext.stroke();

                hasDrawing = true;
                if (placeholder) placeholder.hidden = true;
                event.preventDefault();
            };

            const continueDrawing = event => {
                if (!drawing || !lastPoint) return;
                const point = pointFromEvent(event);
                if (!point) return;

                drawingContext.beginPath();
                drawingContext.moveTo(lastPoint.x, lastPoint.y);
                drawingContext.lineTo(point.x, point.y);
                drawingContext.stroke();
                lastPoint = point;
                event.preventDefault();
            };

            const finishDrawing = () => {
                if (!drawing) return;
                drawing = false;
                lastPoint = null;
                drawingContext.globalCompositeOperation = 'source-over';
                saveHistory();
                setStatus('drawing-status-message', 'your little masterpiece is taking shape ♡');
            };

            drawingCanvas.addEventListener('pointerdown', startDrawing);
            drawingCanvas.addEventListener('pointermove', continueDrawing);
            ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(eventName => {
                drawingCanvas.addEventListener(eventName, finishDrawing);
            });

            sizeInput?.addEventListener('input', () => {
                if (sizeOutput) {
                    sizeOutput.value = sizeInput.value;
                    sizeOutput.textContent = sizeInput.value;
                }
            });

            const setDrawingTool = useEraser => {
                erasing = useEraser;
                const brushButton = byId('drawing-brush-button');
                const eraserButton = byId('drawing-eraser-button');

                brushButton?.classList.toggle('active', !useEraser);
                eraserButton?.classList.toggle('active', useEraser);
                brushButton?.setAttribute('aria-pressed', String(!useEraser));
                eraserButton?.setAttribute('aria-pressed', String(useEraser));
            };

            byId('drawing-brush-button')?.addEventListener('click', () => setDrawingTool(false));
            byId('drawing-eraser-button')?.addEventListener('click', () => setDrawingTool(true));

            undoButton?.addEventListener('click', () => {
                if (historyIndex > 0) restoreHistory(historyIndex - 1);
            });

            redoButton?.addEventListener('click', () => {
                if (historyIndex < history.length - 1) restoreHistory(historyIndex + 1);
            });

            byId('drawing-clear-button')?.addEventListener('click', () => {
                drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                hasDrawing = false;
                if (placeholder) placeholder.hidden = false;
                saveHistory();
                setStatus('drawing-status-message', 'a fresh canvas, ready for a new little masterpiece');
            });

            byId('drawing-download-button')?.addEventListener('click', () => {
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = drawingCanvas.width;
                exportCanvas.height = drawingCanvas.height;

                const exportContext = exportCanvas.getContext('2d');
                if (!exportContext) {
                    setStatus('drawing-status-message', 'could not create the image — please try again');
                    return;
                }

                exportContext.fillStyle = '#fffafd';
                exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                exportContext.drawImage(drawingCanvas, 0, 0);

                exportCanvas.toBlob(blob => {
                    if (blob) {
                        downloadBlob(blob, 'priti-birthday-drawing.png');
                        setStatus('drawing-status-message', 'your drawing has been downloaded ♡');
                    } else {
                        setStatus('drawing-status-message', 'could not create the image — please try again');
                    }
                }, 'image/png');
            });

            updateHistoryButtons();
            saveHistory();
        }
    }

    /* ------------------------------------------------------------
       14. personal letter box and text download
       ------------------------------------------------------------ */

    const personalLetterDate = byId('personal-letter-date');
    const personalLetterTitle = byId('personal-letter-name');
    const personalLetterMessage = byId('personal-letter-message');

    if (personalLetterDate) {
        personalLetterDate.textContent = new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date());
    }

    byId('personal-letter-clear-button')?.addEventListener('click', () => {
        if (personalLetterTitle) personalLetterTitle.value = '';
        if (personalLetterMessage) personalLetterMessage.value = '';
        setStatus('personal-letter-status', 'your letter box is ready for new words');
        personalLetterTitle?.focus();
    });

    byId('personal-letter-download-button')?.addEventListener('click', () => {
        const title = personalLetterTitle?.value.trim() || 'a little letter';
        const message = personalLetterMessage?.value.trim() || '';

        if (!message) {
            setStatus('personal-letter-status', 'write a few words first, then download your letter ♡');
            personalLetterMessage?.focus();
            return;
        }

        const date = personalLetterDate?.textContent || new Date().toLocaleDateString('en-IN');
        const contents = `${title}\n${date}\n\n${message}\n\n♡\n`;
        downloadText(contents, 'my-little-letter.txt');
        setStatus('personal-letter-status', 'your letter has been downloaded and stays yours ♡');
    });

    /* ------------------------------------------------------------
       15. birthday selfie booth
       ------------------------------------------------------------ */

    let cameraStream = null;
    const cameraPreview = byId('selfie-camera-preview');
    const capturedImage = byId('selfie-captured-image');
    const captureCanvas = byId('selfie-capture-canvas');
    const previewFrame = $('.selfie-preview-frame');
    const previewPlaceholder = byId('selfie-preview-placeholder');
    const startCameraButton = byId('selfie-start-camera-button');
    const captureButton = byId('selfie-capture-button');
    const retakeButton = byId('selfie-retake-button');
    const selfieDownloadButton = byId('selfie-download-button');

    const stopCamera = () => {
        if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        if (cameraPreview) cameraPreview.srcObject = null;
        previewFrame?.classList.remove('is-live');
    };

    const startCamera = async () => {
        if (!startCameraButton) return;

        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus('selfie-status-message', 'camera access needs a supported browser and a secure connection (HTTPS)');
            return;
        }

        startCameraButton.disabled = true;
        setStatus('selfie-status-message', 'opening your little photo booth...');

        try {
            stopCamera();
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 960 }
                },
                audio: false
            });

            if (!cameraPreview) throw new Error('camera preview is unavailable');

            cameraPreview.srcObject = cameraStream;
            cameraPreview.hidden = false;
            await cameraPreview.play().catch(() => {});

            if (capturedImage) {
                capturedImage.hidden = true;
                capturedImage.removeAttribute('src');
            }

            previewFrame?.classList.remove('has-capture');
            previewFrame?.classList.add('is-live');
            hideElement(captureCanvas);
            hideElement(previewPlaceholder);

            if (captureButton) captureButton.disabled = false;
            if (retakeButton) retakeButton.disabled = true;
            if (selfieDownloadButton) selfieDownloadButton.disabled = true;

            setStatus('selfie-status-message', 'camera is ready — capture your birthday moment ♡');
        } catch (error) {
            stopCamera();
            setStatus(
                'selfie-status-message',
                error?.name === 'NotAllowedError'
                    ? 'camera permission was not granted — you can allow it in your browser settings'
                    : 'could not start the camera; check that no other app is using it'
            );
        } finally {
            startCameraButton.disabled = false;
        }
    };

    startCameraButton?.addEventListener('click', startCamera);

    captureButton?.addEventListener('click', () => {
        if (!cameraPreview || !captureCanvas || !cameraPreview.videoWidth || !cameraPreview.videoHeight) {
            setStatus('selfie-status-message', 'start the camera and wait for the preview first');
            return;
        }

        const width = cameraPreview.videoWidth;
        const height = cameraPreview.videoHeight;
        captureCanvas.width = width;
        captureCanvas.height = height;

        const context = captureCanvas.getContext('2d');
        if (!context) {
            setStatus('selfie-status-message', 'could not capture the photograph — please try again');
            return;
        }

        context.save();
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(cameraPreview, 0, 0, width, height);
        context.restore();

        if (capturedImage) {
            capturedImage.src = captureCanvas.toDataURL('image/jpeg', 0.94);
            capturedImage.hidden = false;
        }

        cameraPreview.hidden = true;
        stopCamera();
        previewFrame?.classList.remove('is-live');
        previewFrame?.classList.add('has-capture');
        hideElement(previewPlaceholder);

        captureButton.disabled = true;
        if (retakeButton) retakeButton.disabled = false;
        if (selfieDownloadButton) selfieDownloadButton.disabled = false;

        setStatus('selfie-status-message', 'your birthday selfie is ready to download ♡');
    });

    retakeButton?.addEventListener('click', async () => {
        if (capturedImage) {
            capturedImage.hidden = true;
            capturedImage.removeAttribute('src');
        }

        previewFrame?.classList.remove('has-capture', 'is-live');
        showElement(previewPlaceholder);
        if (retakeButton) retakeButton.disabled = true;
        if (selfieDownloadButton) selfieDownloadButton.disabled = true;
        if (captureButton) captureButton.disabled = true;

        await startCamera();
    });

    selfieDownloadButton?.addEventListener('click', () => {
        if (!captureCanvas || !captureCanvas.width || !captureCanvas.height) {
            setStatus('selfie-status-message', 'take your selfie first, then download it ♡');
            return;
        }

        captureCanvas.toBlob(blob => {
            if (blob) {
                downloadBlob(blob, 'priti-birthday-selfie.jpg');
                setStatus('selfie-status-message', 'your selfie has been saved to your device ♡');
            } else {
                setStatus('selfie-status-message', 'could not save the photograph — please try again');
            }
        }, 'image/jpeg', 0.94);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden || !cameraStream) return;

        stopCamera();
        if (captureButton) captureButton.disabled = true;
        setStatus('selfie-status-message', 'camera paused while you were away — start it again when ready');
        if (!capturedImage || capturedImage.hidden) showElement(previewPlaceholder);
    });

    window.addEventListener('pagehide', stopCamera);
    window.addEventListener('beforeunload', stopCamera);

    /* ------------------------------------------------------------
       16. final celebration fireworks
       ------------------------------------------------------------ */

    byId('final-fireworks-button')?.addEventListener('click', () => {
        launchFireworks(byId('final-fireworks-canvas'), 6500);
        toast('one more celebration for priti ✨');
    });

    /* ------------------------------------------------------------
       17. gentle reveal animations
       ------------------------------------------------------------ */

    const revealTargets = $$(
        '.memory-card, .video-card, .wish-card, .personal-letter-card, .selfie-booth-card, .drawing-studio-card, .section-heading'
    );

    if ('IntersectionObserver' in window && !reducedMotion && typeof Element.prototype.animate === 'function') {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                entry.target.animate(
                    [
                        { opacity: 0.35, transform: 'translateY(16px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ],
                    {
                        duration: 620,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        fill: 'both'
                    }
                );

                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

        revealTargets.forEach(target => revealObserver.observe(target));
    }

    /* Keep the opening screen alive before the gift interaction begins. */
    seedIntroAtmosphere();
    const introGarden = byId('intro-balloon-garden');
    if (introGarden && !reducedMotion) {
        window.setInterval(() => {
            if (introGarden.children.length < 24) makeDecorativeBalloon(introGarden, { minDuration: 15, maxDuration: 25 });
        }, 1650);
    }

    /* ------------------------------------------------------------
       18. reliable initial and cleanup states
       ------------------------------------------------------------ */

    hideElement(celebration);
    hideElement(mainSite);
    hideElement(whistleStage);
    hideElement(cakeCuttingStage);
    hideElement(byId('birthday-letter-paper'));
    hideElement(byId('wish-confirmation'));
    hideElement(byId('candles-out-message'));
    hideElement(byId('cake-cutting-celebration'));

    if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'open navigation menu');
    }

    if (lightbox) lightbox.hidden = true;
    if (popup) popup.hidden = true;
    if (cameraPreview) cameraPreview.hidden = true;
    hideElement(secretTrigger);
    if (secretOverlay) secretOverlay.hidden = true;
    updateMusicButton(Boolean(audio && !audio.paused));
    updateScrollUI();
})();

/* =====================================================================
   PRITI'S LITTLE BLUE UNIVERSE — isolated interaction layer
   This module is deliberately namespaced and does not replace existing
   website listeners, Minecraft quests, music, letter or celebration code.
   ===================================================================== */
(() => {
    'use strict';

    const root = document.getElementById('priti-little-world');
    if (!root) return;

    const one = (selector, scope = root) => scope.querySelector(selector);
    const many = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));
    const announce = (selector, message) => {
        const target = one(selector);
        if (target) target.textContent = message;
    };
    const reducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* -------------------------------------------------------------
       01 · Dress moodboard. Buttons alter only this preview panel.
       ------------------------------------------------------------- */
    const looks = {
        'blue-hour': {
            title: 'Blue hour',
            description: 'A calm blue palette with a little shimmer — a tiny nod to her favourite colour.'
        },
        hibiscus: {
            title: 'Hibiscus bloom',
            description: 'A bright floral mood inspired by her favourite flower: cheerful, expressive, and full of colour.'
        },
        'rain-cloud': {
            title: 'Rain-cloud grey',
            description: 'A soft rainy-day palette for slow afternoons, cool breezes, and a cosy cup of coffee.'
        },
        midnight: {
            title: 'Midnight sparkle',
            description: 'Deep blue-violet tones with a little starlight — a dress-up mood for a special evening.'
        },
        coconut: {
            title: 'Coconut-grove green',
            description: 'Fresh green shades inspired by the trees she loves and the peaceful feeling of a garden.'
        }
    };
    const preview = one('#plw-atelier-preview');
    const lookButtons = many('[data-plw-look]');
    const applyLook = key => {
        const look = looks[key];
        if (!look || !preview) return;
        preview.dataset.look = key;
        announce('#plw-look-title', look.title);
        announce('#plw-look-description', look.description);
        lookButtons.forEach(button => {
            const selected = button.dataset.plwLook === key;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    };
    lookButtons.forEach(button => button.addEventListener('click', () => applyLook(button.dataset.plwLook)));
    one('#plw-surprise-look')?.addEventListener('click', () => {
        const available = Object.keys(looks).filter(key => key !== (preview?.dataset.look || ''));
        const next = available[Math.floor(Math.random() * available.length)] || 'blue-hour';
        applyLook(next);
        announce('#plw-surprise-look', 'your new mood is ready ✧');
        window.setTimeout(() => announce('#plw-surprise-look', 'surprise me with a mood ✧'), 1900);
    });

    /* -------------------------------------------------------------
       02 · Recipe inspiration wheel. This offers ideas, not claims
       about foods Priti has already made or likes.
       ------------------------------------------------------------- */
    const recipeIdeas = [
        { emoji: '🍟', title: 'Loaded masala fries', description: 'A fun twist on her favourite crispy snack, with a sprinkle of seasoning and a dip on the side.', tag: 'A LITTLE CRUNCH OF JOY' },
        { emoji: '🥑', title: 'Colourful toast bites', description: 'Small toast squares with a creamy spread, fresh toppings, and a little crunch.', tag: 'TINY BITES · BIG COLOUR' },
        { emoji: '🍝', title: 'Creamy comfort pasta', description: 'A cosy bowl of pasta with a smooth sauce, herbs, and a little grated cheese.', tag: 'COMFORT IN A BOWL' },
        { emoji: '🥪', title: 'Crispy sandwich pockets', description: 'Toasted sandwich triangles with a warm filling and a golden outside.', tag: 'GOLDEN AND TOASTY' },
        { emoji: '🍹', title: 'Guava cooler', description: 'A chilled guava drink idea with lime and mint for a fresh afternoon treat.', tag: 'A NOD TO HER FAVOURITE FRUIT' },
        { emoji: '🥔', title: 'Herb potato wedges', description: 'Oven-baked potato wedges tossed with herbs and served with a favourite dip.', tag: 'A CRISPY LITTLE SIDE' },
        { emoji: '🍰', title: 'Mini chocolate cups', description: 'Little dessert cups layered with chocolate, biscuit crumbs, and a soft topping.', tag: 'A SWEET LITTLE SURPRISE' },
        { emoji: '🌽', title: 'Buttery corn bowls', description: 'Warm sweet corn with butter, pepper, herbs, and a squeeze of lime.', tag: 'SIMPLE · WARM · HAPPY' },
        { emoji: '🥞', title: 'Fluffy pancake stack', description: 'A small stack with fruit and a drizzle of syrup for a relaxed breakfast idea.', tag: 'SLOW MORNING ENERGY' },
        { emoji: '🥗', title: 'Rainbow salad jars', description: 'A colourful layered salad with crunchy vegetables and a dressing packed separately.', tag: 'A LITTLE COLOUR IN A JAR' },
        { emoji: '🍪', title: 'Soft cookie batch', description: 'A small batch of soft cookies to bake, decorate, and share while they are still warm.', tag: 'MADE WITH A LITTLE PATIENCE' },
        { emoji: '☕', title: 'Coffee and a tiny treat', description: 'Make a cup of coffee and pair it with a simple homemade snack for a slow catch-up.', tag: 'A CUP AND A CONVERSATION' },
        { emoji: '🍕', title: 'Mini homemade pizzas', description: 'Small personal pizzas with favourite toppings and a little kitchen creativity.', tag: 'BUILD YOUR OWN LITTLE PIZZA' },
        { emoji: '🍓', title: 'Fruit-and-yoghurt bowl', description: 'A colourful bowl with fruit, yoghurt, and a light crunchy topping.', tag: 'FRESH LITTLE COLOURS' },
        { emoji: '🥟', title: 'Stuffed pocket bites', description: 'Crisp little pastry pockets with a savoury filling, served warm.', tag: 'A HANDHELD KITCHEN EXPERIMENT' },
        { emoji: '🧁', title: 'Tiny decorated cupcakes', description: 'Small cupcakes with colourful icing — a chance to experiment with patterns and decorations.', tag: 'DECORATE THEM YOUR WAY' }
    ];
    let lastRecipeIndex = -1;
    const recipeButton = one('#plw-recipe-spin');
    recipeButton?.addEventListener('click', () => {
        let nextIndex = Math.floor(Math.random() * recipeIdeas.length);
        if (recipeIdeas.length > 1 && nextIndex === lastRecipeIndex) nextIndex = (nextIndex + 1) % recipeIdeas.length;
        lastRecipeIndex = nextIndex;
        const recipe = recipeIdeas[nextIndex];
        announce('#plw-recipe-emoji', recipe.emoji);
        announce('#plw-recipe-title', recipe.title);
        announce('#plw-recipe-description', recipe.description);
        announce('#plw-recipe-tag', recipe.tag);
        announce('#plw-recipe-number', String(nextIndex + 1).padStart(2, '0'));
        if (!reducedMotion) {
            const plate = one('.plw-kitchen-plate');
            plate?.animate([{ transform: 'rotate(-7deg) scale(.92)' }, { transform: 'rotate(5deg) scale(1.04)' }, { transform: 'rotate(0) scale(1)' }], { duration: 430, easing: 'cubic-bezier(.22,1,.36,1)' });
        }
    });

    /* -------------------------------------------------------------
       03 · Favourite-things quiz. Answer feedback is announced and
       the game can be replayed without reloading the page.
       ------------------------------------------------------------- */
    const questions = [
        { category: 'A LITTLE DETAIL', prompt: "Which flower is Priti's favourite?", answers: ['Rose', 'Hibiscus', 'Sunflower', 'Jasmine'], correct: 1, note: 'Hibiscus — a bright little bloom, just like this chapter.' },
        { category: 'A LITTLE BITE', prompt: 'Which fruit belongs in her favourites?', answers: ['Guava', 'Pineapple', 'Peach', 'Watermelon'], correct: 0, note: 'Guava! That one deserves its own little corner.' },
        { category: 'A LITTLE SHADE', prompt: 'What is her favourite colour?', answers: ['Yellow', 'Purple', 'Blue', 'Orange'], correct: 2, note: 'Blue — so this whole chapter wears a little blue for her.' },
        { category: 'A LITTLE GETAWAY', prompt: 'Which place does she wish to visit with me?', answers: ['Ooty', 'Guna Caves', 'Kodaikanal Lake', 'Marina Beach'], correct: 1, note: 'Guna Caves — saved on the someday list.' },
        { category: 'A LITTLE SOUNDTRACK', prompt: 'Which songs does she love?', answers: ['Vijay songs', 'Only classical music', 'Only instrumental music', 'Only old film songs'], correct: 0, note: 'Vijay songs! Her soundtrack gets the spotlight.' },
        { category: 'A LITTLE SCREEN TIME', prompt: 'Which show does she like most, followed by Bigg Boss?', answers: ['Cooku with Comali', 'KKK', 'Super Singer', 'Dance Jodi Dance'], correct: 1, note: 'KKK first, Bigg Boss next. The order is remembered!' }
    ];
    let quizIndex = 0;
    let quizScore = 0;
    let quizLocked = false;
    const quizStage = one('#plw-quiz-stage');
    const quizResult = one('#plw-quiz-result');
    const renderQuestion = () => {
        const question = questions[quizIndex];
        if (!question) return;
        quizLocked = false;
        announce('#plw-quiz-progress', `QUESTION ${String(quizIndex + 1).padStart(2, '0')} / ${String(questions.length).padStart(2, '0')}`);
        const progress = one('#plw-quiz-progress-fill');
        if (progress) progress.style.width = `${(quizIndex / questions.length) * 100}%`;
        announce('#plw-quiz-stage .plw-quiz-category', question.category);
        announce('#plw-quiz-question', question.prompt);
        announce('#plw-quiz-feedback', 'Choose one little answer.');
        const options = one('#plw-quiz-options');
        if (!options) return;
        options.replaceChildren();
        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'plw-quiz-option';
            button.textContent = answer;
            button.addEventListener('click', () => chooseAnswer(index, button));
            options.appendChild(button);
        });
    };
    const finishQuiz = () => {
        if (quizStage) quizStage.hidden = true;
        if (quizResult) quizResult.hidden = false;
        const percent = Math.round((quizScore / questions.length) * 100);
        announce('#plw-quiz-progress', 'YOUR LITTLE RESULT');
        const progress = one('#plw-quiz-progress-fill');
        if (progress) progress.style.width = '100%';
        announce('#plw-quiz-result-title', quizScore === questions.length ? 'You know every little detail!' : quizScore >= 4 ? 'You know her world so well!' : 'A little more to learn, a lot to celebrate!');
        announce('#plw-quiz-result-copy', `You got ${quizScore} out of ${questions.length} right (${percent}%). The sweetest part is that these details are worth remembering. Have another go and see whether you can collect all six stars.`);
    };
    const chooseAnswer = (selectedIndex, selectedButton) => {
        if (quizLocked) return;
        quizLocked = true;
        const question = questions[quizIndex];
        const buttons = many('.plw-quiz-option', one('#plw-quiz-options'));
        buttons.forEach((button, index) => {
            button.disabled = true;
            if (index === question.correct) button.classList.add('is-correct');
            if (index === selectedIndex && index !== question.correct) button.classList.add('is-wrong');
        });
        if (selectedIndex === question.correct) {
            quizScore += 1;
            announce('#plw-quiz-feedback', `That's right! ${question.note}`);
        } else {
            announce('#plw-quiz-feedback', `A little miss — ${question.note}`);
        }
        window.setTimeout(() => {
            quizIndex += 1;
            if (quizIndex >= questions.length) finishQuiz();
            else renderQuestion();
        }, 1250);
    };
    one('#plw-quiz-restart')?.addEventListener('click', () => {
        quizIndex = 0;
        quizScore = 0;
        quizLocked = false;
        if (quizStage) quizStage.hidden = false;
        if (quizResult) quizResult.hidden = true;
        renderQuestion();
    });
    renderQuestion();

    /* -------------------------------------------------------------
       04 · A six-pair memory match. A mismatch is briefly shown and
       then concealed. Tiles are real buttons for keyboard access.
       ------------------------------------------------------------- */
    const treasures = [
        { key: 'guava', face: '🥝', name: 'guava' },
        { key: 'hibiscus', face: '🌺', name: 'hibiscus' },
        { key: 'coffee', face: '☕', name: 'coffee' },
        { key: 'blue', face: '💙', name: 'blue heart' },
        { key: 'rain', face: '🌧️', name: 'rain cloud' },
        { key: 'fries', face: '🍟', name: 'fries' }
    ];
    const matchGrid = one('#plw-match-grid');
    let matchDeck = [];
    let flippedTiles = [];
    let matchedKeys = new Set();
    let moves = 0;
    let matchLocked = false;
    let mismatchTimer = 0;
    const shuffle = entries => {
        const result = entries.slice();
        for (let index = result.length - 1; index > 0; index -= 1) {
            const other = Math.floor(Math.random() * (index + 1));
            [result[index], result[other]] = [result[other], result[index]];
        }
        return result;
    };
    const updateMatchStats = () => {
        announce('#plw-match-moves', String(moves));
        announce('#plw-match-pairs', `${matchedKeys.size}/${treasures.length}`);
    };
    const concealTile = button => {
        button.classList.remove('is-revealed');
        button.textContent = '';
        button.setAttribute('aria-label', 'Hidden treasure tile');
    };
    const revealTile = (button, item) => {
        button.classList.add('is-revealed');
        button.textContent = item.face;
        button.setAttribute('aria-label', `${item.name} tile`);
    };
    const flipTile = button => {
        if (matchLocked || button.classList.contains('is-revealed') || button.classList.contains('is-matched')) return;
        const item = matchDeck[Number(button.dataset.tileIndex)];
        if (!item) return;
        revealTile(button, item);
        flippedTiles.push({ button, item });
        if (flippedTiles.length < 2) return;
        moves += 1;
        updateMatchStats();
        const [first, second] = flippedTiles;
        if (first.item.key === second.item.key) {
            first.button.classList.add('is-matched');
            second.button.classList.add('is-matched');
            first.button.disabled = true;
            second.button.disabled = true;
            matchedKeys.add(first.item.key);
            flippedTiles = [];
            announce('#plw-match-status', matchedKeys.size === treasures.length ? `All six pairs found in ${moves} moves. You collected every little treasure! ♡` : 'A lovely match! Find another pair.');
            updateMatchStats();
        } else {
            matchLocked = true;
            announce('#plw-match-status', 'Not a pair this time. The tiles will turn back over.');
            mismatchTimer = window.setTimeout(() => {
                first.button.disabled = false;
                second.button.disabled = false;
                concealTile(first.button);
                concealTile(second.button);
                flippedTiles = [];
                matchLocked = false;
                announce('#plw-match-status', 'Try another pair. You have got this.');
            }, 850);
        }
    };
    const startMatchGame = () => {
        window.clearTimeout(mismatchTimer);
        matchLocked = false;
        flippedTiles = [];
        matchedKeys = new Set();
        moves = 0;
        matchDeck = shuffle([...treasures, ...treasures].map((item, index) => ({ ...item, uniqueId: `${item.key}-${index}-${Math.random().toString(36).slice(2, 7)}` })));
        if (!matchGrid) return;
        matchGrid.replaceChildren();
        matchDeck.forEach((item, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'plw-match-tile';
            button.dataset.tileIndex = String(index);
            button.setAttribute('aria-label', 'Hidden treasure tile');
            button.addEventListener('click', () => flipTile(button));
            matchGrid.appendChild(button);
        });
        updateMatchStats();
        announce('#plw-match-status', 'Turn over two cards to find a pair.');
    };
    one('#plw-match-reset')?.addEventListener('click', startMatchGame);
    startMatchGame();

    /* -------------------------------------------------------------
       05 · Rain ambience. A short loop of filtered noise is created
       only after the visitor presses play; no external audio needed.
       ------------------------------------------------------------- */
    let audioContext = null;
    let rainSource = null;
    let rainFilter = null;
    let rainGain = null;
    let rainPlaying = false;
    const rainButton = one('#plw-rain-toggle');
    const updateRainState = playing => {
        rainPlaying = playing;
        rainButton?.setAttribute('aria-pressed', String(playing));
        announce('#plw-rain-button-label', playing ? 'stop soft rain ambience' : 'play soft rain ambience');
        announce('#plw-rain-status', playing ? 'soft rain is playing · take a little pause' : 'sound is off · your quiet corner is ready');
    };
    const stopRain = () => {
        if (rainSource) {
            try { rainSource.stop(); } catch (_) { /* It may already have stopped. */ }
            try { rainSource.disconnect(); } catch (_) { /* Safe cleanup. */ }
        }
        if (rainFilter) { try { rainFilter.disconnect(); } catch (_) {} }
        if (rainGain) { try { rainGain.disconnect(); } catch (_) {} }
        rainSource = null;
        rainFilter = null;
        rainGain = null;
        updateRainState(false);
    };
    const startRain = async () => {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) {
            announce('#plw-rain-status', 'This browser does not support generated audio. The rainy-day corner is still yours.');
            return;
        }
        try {
            audioContext = audioContext || new AudioContextConstructor();
            if (audioContext.state === 'suspended') await audioContext.resume();
            const sampleRate = audioContext.sampleRate;
            const seconds = 3;
            const buffer = audioContext.createBuffer(1, sampleRate * seconds, sampleRate);
            const data = buffer.getChannelData(0);
            let previous = 0;
            for (let index = 0; index < data.length; index += 1) {
                const white = Math.random() * 2 - 1;
                previous = (previous + 0.025 * white) / 1.025;
                data[index] = previous * 3.5;
            }
            rainSource = audioContext.createBufferSource();
            rainSource.buffer = buffer;
            rainSource.loop = true;
            rainFilter = audioContext.createBiquadFilter();
            rainFilter.type = 'lowpass';
            rainFilter.frequency.value = 1150;
            rainGain = audioContext.createGain();
            rainGain.gain.value = 0;
            rainSource.connect(rainFilter);
            rainFilter.connect(rainGain);
            rainGain.connect(audioContext.destination);
            rainSource.start();
            rainGain.gain.setTargetAtTime(0.14, audioContext.currentTime, 0.7);
            updateRainState(true);
        } catch (error) {
            updateRainState(false);
            announce('#plw-rain-status', 'Rain ambience could not start in this browser. You can still enjoy the quiet visual.');
        }
    };
    rainButton?.addEventListener('click', () => {
        if (rainPlaying) stopRain();
        else startRain();
    });
    window.addEventListener('pagehide', stopRain);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && rainPlaying) stopRain();
    });

    /* -------------------------------------------------------------
       06 · Gentle reveal for newly added cards. The pre-existing
       website reveal system remains independent of this observer.
       ------------------------------------------------------------- */
    if ('IntersectionObserver' in window && !reducedMotion) {
        const targets = many('.plw-favourite-card, .plw-adventure-card, .plw-lucky-card, .plw-distance-card, .plw-note-card');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                if (typeof entry.target.animate === 'function') {
                    entry.target.animate([
                        { opacity: 0.35, transform: 'translateY(14px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
                }
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
        targets.forEach(target => observer.observe(target));
    }
})();
