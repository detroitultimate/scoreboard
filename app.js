/**
 * DUFL Ultimate Frisbee Sideline App
 * Core Logic & State Management
 */

console.log("DUFL App Script Loading...");

const INITIAL_STATE = {
    game: {
        score: { us: 0, them: 0 },
        timeouts: { us: 2, them: 2 },
        totalClock: 90 * 60,
        pointClock: 0,
        isPaused: true,
        period: 1,
        hasStarted: false,
    },
    ui: {},
    settings: {
        teamUsName: "Team 1",
        teamThemName: "Team 2",
        teamUsColor: "#4f46e5",
        teamThemColor: "#ef4444",
        gameDuration: 90,
        periods: 1,
        ratioRule: 'ABBA',
        ratioADef: '4M/3F',
        ratioBDef: '3M/4F',
        ratioSequence: 'AB',
        soundEnabled: true,
        theme: 'dark',
        timerSound: 'classic',
        soundVolume: 0.5
    },
    lineup: {
        currentPoint: 1,
        genderRatio: '4M/3F',
        ratioIndexOverride: null
    }
};

let state = JSON.parse(JSON.stringify(INITIAL_STATE));
let history = [];
const PRESET_COLORS = [
    "#ffffff", // White
    "#ef4444", // Red
    "#f59e0b", // Orange
    "#eab308", // Yellow
    "#10b981", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#4f46e5", // Indigo
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#101010"  // Black
];

// --- Logic Modules ---

function pushHistory() {
    history.push(JSON.stringify(state));
    if (history.length > 50) history.shift();
    updateUndoButton();
}

function undo() {
    if (history.length > 0) {
        state = JSON.parse(history.pop());
        render();
        saveState();
        updateUndoButton();
    }
}

function getCurrentRatioInfo() {
    const rule = state.settings.ratioRule;
    const pointNumber = state.lineup.currentPoint;
    let sequence = "";
    let index = -1;

    if (rule === 'FIXED_M') {
        sequence = "A";
        index = 0;
    } else if (rule === 'FIXED_F') {
        sequence = "B";
        index = 0;
    } else if (rule === 'MANUAL') {
        sequence = state.settings.ratioSequence || 'AB';
        index = (state.lineup.ratioIndexOverride !== null)
            ? state.lineup.ratioIndexOverride
            : (sequence.length > 0 ? (pointNumber - 1) % sequence.length : 0);
    } else {
        // ABBA or US_PRESCRIBED
        sequence = "ABBA";
        index = (state.lineup.ratioIndexOverride !== null)
            ? state.lineup.ratioIndexOverride
            : (pointNumber - 1) % 4;
    }

    return { sequence, index };
}

function getRatioForPoint(pointNumber) {
    const ratioA = state.settings.ratioADef || '4M/3F';
    const ratioB = state.settings.ratioBDef || '3M/4F';
    const { sequence, index } = getCurrentRatioInfo();

    if (sequence.length === 0) return ratioA;
    return sequence[index] === 'A' ? ratioA : ratioB;
}

let lastTick = 0;
function tick(timestamp) {
    if (!state.game.isPaused) {
        if (!lastTick) lastTick = timestamp;
        const delta = (timestamp - lastTick) / 1000;

        if (delta >= 1) {
            state.game.totalClock -= 1;
            state.game.pointClock += 1;
            lastTick = timestamp;

            if (state.game.totalClock === 0) {
                triggerGameEndEffects();
            }
            renderClock();
        }
    } else {
        lastTick = 0;
    }
    requestAnimationFrame(tick);
}

// --- UI Interaction ---

function togglePause() {
    pushHistory();
    state.game.isPaused = !state.game.isPaused;
    if (!state.game.isPaused) state.game.hasStarted = true;
    render();
}

function scoreGoal(team) {
    pushHistory();
    const { sequence, index } = getCurrentRatioInfo();
    state.game.score[team]++;
    state.lineup.currentPoint++;

    // Continue sequence from current position
    if (sequence.length > 0) {
        state.lineup.ratioIndexOverride = (index + 1) % sequence.length;
    }

    state.lineup.genderRatio = getRatioForPoint(state.lineup.currentPoint);
    state.game.pointClock = 0;
    saveState();
    render();
}

function adjustScore(team, amount) {
    pushHistory();
    const { sequence, index } = getCurrentRatioInfo();
    state.game.score[team] = Math.max(0, state.game.score[team] + amount);

    // Track sequence shift if point total changes
    if (amount !== 0 && sequence.length > 0) {
        state.lineup.currentPoint = Math.max(1, state.lineup.currentPoint + amount);
        state.lineup.ratioIndexOverride = (index + amount + sequence.length) % sequence.length;
        state.lineup.genderRatio = getRatioForPoint(state.lineup.currentPoint);
    }

    saveState();
    render();
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('active');

    document.getElementById('team-us-name').value = state.settings.teamUsName;
    document.getElementById('team-them-name').value = state.settings.teamThemName;
    document.getElementById('game-duration').value = state.settings.gameDuration;
    document.getElementById('game-periods').value = state.settings.periods;
    document.getElementById('ratio-rule').value = state.settings.ratioRule || 'ABBA';
    document.getElementById('ratio-a-def').value = state.settings.ratioADef || '4M/3F';
    document.getElementById('ratio-b-def').value = state.settings.ratioBDef || '3M/4F';
    document.getElementById('ratio-sequence').value = state.settings.ratioSequence || 'AB';

    const seqGroup = document.getElementById('ratio-sequence-group');
    if (seqGroup) seqGroup.style.display = (state.settings.ratioRule === 'MANUAL') ? 'block' : 'none';

    document.getElementById('team-us-custom-color').value = state.settings.teamUsColor;
    document.getElementById('team-them-custom-color').value = state.settings.teamThemColor;
    document.getElementById('timer-sound').value = state.settings.timerSound || 'classic';
    document.getElementById('timer-volume').value = state.settings.soundVolume || 0.5;

    renderColorPickers();
}

function renderColorPickers() {
    const usPicker = document.getElementById('team-us-color-picker');
    const themPicker = document.getElementById('team-them-color-picker');
    if (!usPicker || !themPicker) return;

    [usPicker, themPicker].forEach((picker, idx) => {
        picker.innerHTML = PRESET_COLORS.map(c => `
            <div class="color-option ${c.toLowerCase() === (idx === 0 ? state.settings.teamUsColor.toLowerCase() : state.settings.teamThemColor.toLowerCase()) ? 'active' : ''}" 
                 style="background: ${c}" 
                 data-color="${c}" 
                 data-team="${idx === 0 ? 'us' : 'them'}"></div>
        `).join('');
    });
}

function saveSettings() {
    pushHistory();
    state.settings.teamUsName = document.getElementById('team-us-name').value;
    state.settings.teamThemName = document.getElementById('team-them-name').value;
    state.settings.gameDuration = parseInt(document.getElementById('game-duration').value);
    state.settings.periods = parseInt(document.getElementById('game-periods').value);
    state.settings.ratioRule = document.getElementById('ratio-rule').value;
    state.settings.ratioADef = document.getElementById('ratio-a-def').value;
    state.settings.ratioBDef = document.getElementById('ratio-b-def').value;
    state.settings.ratioSequence = document.getElementById('ratio-sequence').value.toUpperCase().replace(/[^AB]/g, '') || 'AB';
    state.settings.timerSound = document.getElementById('timer-sound').value;
    state.settings.soundVolume = parseFloat(document.getElementById('timer-volume').value);
    state.game.totalClock = state.settings.gameDuration * 60;
    state.lineup.genderRatio = getRatioForPoint(state.lineup.currentPoint);
    document.getElementById('settings-modal').classList.remove('active');
    saveState();
    render();
}

function toggleRatio() {
    pushHistory();
    const { sequence, index } = getCurrentRatioInfo();
    if (sequence.length > 0) {
        state.lineup.ratioIndexOverride = (index + 1) % sequence.length;
        state.lineup.genderRatio = getRatioForPoint(state.lineup.currentPoint);
    }
    saveState();
    render();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function toggleSound() {
    pushHistory();
    state.settings.soundEnabled = !state.settings.soundEnabled;
    saveState();
    render();
}

function toggleTheme() {
    pushHistory();
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    saveState();
    render();
}

function triggerGameEndEffects() {
    // Flash Screen
    document.body.classList.add('flash-expire');
    setTimeout(() => {
        document.body.classList.remove('flash-expire');
    }, 5000); // Flash for 5 seconds

    // Play Sound
    if (state.settings.soundEnabled) {
        playEndGameSound();
    }
}

function playEndGameSound(soundType = null, volume = null) {
    const type = soundType || state.settings.timerSound || 'classic';
    const vol = volume !== null ? volume : (state.settings.soundVolume || 0.5);

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const mainGain = audioCtx.createGain();
        mainGain.connect(audioCtx.destination);
        mainGain.gain.setValueAtTime(vol * 0.3, audioCtx.currentTime);

        if (type === 'classic') {
            // Classic - original rising tone
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
            osc.connect(mainGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 1);
            mainGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

        } else if (type === 'basketball') {
            // Basketball buzzer - harsh dual-tone
            [200, 267].forEach(freq => {
                const osc = audioCtx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                osc.connect(mainGain);
                osc.start();
                osc.stop(audioCtx.currentTime + 1.2);
            });
            mainGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

        } else if (type === 'hockey') {
            // Hockey horn - deep sawtooth
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(85, audioCtx.currentTime);
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(350, audioCtx.currentTime);
            filter.Q.setValueAtTime(8, audioCtx.currentTime);
            osc.connect(filter);
            filter.connect(mainGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.5);
            mainGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

        } else if (type === 'whistle') {
            // Referee whistle - high pitched with warble
            const baseFreq = 2800;
            [baseFreq, baseFreq + 50].forEach(freq => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                const lfo = audioCtx.createOscillator();
                lfo.frequency.setValueAtTime(25, audioCtx.currentTime);
                const lfoGain = audioCtx.createGain();
                lfoGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
                lfo.connect(lfoGain);
                const oscGain = audioCtx.createGain();
                oscGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
                lfoGain.connect(oscGain.gain);
                osc.connect(oscGain);
                oscGain.connect(mainGain);
                lfo.start();
                osc.start();
                osc.stop(audioCtx.currentTime + 0.7);
                lfo.stop(audioCtx.currentTime + 0.7);
            });

        } else if (type === 'soccer') {
            // Soccer/Football horn - European style
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.connect(mainGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.8);
            mainGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.8);

        } else if (type === 'electronic') {
            // Electronic beep - clean digital
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            osc.connect(mainGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
            mainGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        }
    } catch (e) {
        console.error("Audio error:", e);
    }
}

function previewTimerSound() {
    const type = document.getElementById('timer-sound').value;
    const vol = parseFloat(document.getElementById('timer-volume').value);
    playEndGameSound(type, vol);
}


let resetConfirmPending = false;
let resetConfirmTimeout = null;

function resetGame() {
    if (!resetConfirmPending) {
        // First click - enter confirmation state
        resetConfirmPending = true;
        render(); // Re-render to show confirmation button

        // Auto-cancel confirmation after 3 seconds
        resetConfirmTimeout = setTimeout(() => {
            resetConfirmPending = false;
            render();
        }, 3000);
    } else {
        // Second click - perform the reset
        clearTimeout(resetConfirmTimeout);
        resetConfirmPending = false;

        const currentTheme = state.settings.theme; // Preserve theme
        localStorage.removeItem('dufl_game_state');
        state = JSON.parse(JSON.stringify(INITIAL_STATE));
        state.settings.theme = currentTheme; // Restore theme
        state.game.hasStarted = false; // Explicitly ensure it's reset
        state.lineup.ratioIndexOverride = null;
        history = [];
        saveState();
        render();
    }
}

function saveState() {
    localStorage.setItem('dufl_game_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('dufl_game_state');
    if (saved) {
        state = Object.assign(JSON.parse(JSON.stringify(INITIAL_STATE)), JSON.parse(saved));
        // Migration: Update old default names if they exist
        if (state.settings.teamUsName === "US") state.settings.teamUsName = "Team 1";
        if (state.settings.teamThemName === "THEM") state.settings.teamThemName = "Team 2";
    }
}

function formatTime(seconds) {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${seconds < 0 ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
}

function renderClock() {
    const headerClock = document.getElementById('game-clock');
    if (headerClock) headerClock.textContent = formatTime(state.game.totalClock);
    const mainClock = document.querySelector('.scoreboard-section .game-clock');
    if (mainClock) mainClock.textContent = formatTime(state.game.totalClock);
    const ptVal = document.querySelector('.point-timer-val');
    if (ptVal) ptVal.textContent = formatTime(state.game.pointClock);
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.style.opacity = history.length > 0 ? "1" : "0.3";
}

function render() {
    document.documentElement.style.setProperty('--team-us-color', state.settings.teamUsColor);
    document.documentElement.style.setProperty('--team-them-color', state.settings.teamThemColor);

    // Apply Theme
    document.body.classList.toggle('light-mode', state.settings.theme === 'light');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.textContent = state.settings.theme === 'light' ? '☀️' : '🌙';

    const container = document.querySelector('.app-container');
    if (container) container.classList.add('score-only-mode'); // Always force score only mode visual style

    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
        soundBtn.textContent = state.settings.soundEnabled ? '🔊' : '🔇';
        soundBtn.classList.toggle('muted', !state.settings.soundEnabled);
    }

    const scoreboardEl = document.getElementById('scoreboard-section');
    if (scoreboardEl) {
        let pauseBtnLabel = 'PAUSE';
        if (state.game.isPaused) {
            pauseBtnLabel = state.game.hasStarted ? 'RESUME' : 'START';
        }

        const { sequence, index } = getCurrentRatioInfo();
        const sequenceHtml = sequence.split('').map((letter, i) => `
            <span class="seq-letter ${i === index ? 'active-seq-letter' : ''}">${letter}</span>
        `).join('');

        scoreboardEl.innerHTML = `
            <div class="ratio-indicator" style="cursor: pointer">
                <div class="ratio-top">
                    <span class="label">Point ${state.lineup.currentPoint}</span>
                    <div class="ratio-sequence-display">${sequenceHtml}</div>
                </div>
                <span class="ratio-val">${state.lineup.genderRatio}</span>
            </div>
            <div class="score-container">
                <div class="team-score us">
                    <span class="team-label" style="color: var(--team-us-color)">${state.settings.teamUsName}</span>
                    <div class="score-display-wrapper">
                        <div class="score-display fast-score active-border" data-team="us" style="background: ${state.settings.teamUsColor}15; border-color: ${state.settings.teamUsColor}">${state.game.score.us}</div>
                        <div class="manual-score-controls us">
                            <button class="manual-adj-btn" data-team="us" data-action="up">+</button>
                            <button class="manual-adj-btn" data-team="us" data-action="down">-</button>
                        </div>
                    </div>
                </div>
                <div class="score-divider"><span>:</span></div>
                <div class="team-score them">
                    <span class="team-label" style="color: var(--team-them-color)">${state.settings.teamThemName}</span>
                    <div class="score-display-wrapper">
                        <div class="score-display fast-score active-border" data-team="them" style="background: ${state.settings.teamThemColor}15; border-color: ${state.settings.teamThemColor}">${state.game.score.them}</div>
                        <div class="manual-score-controls them">
                            <button class="manual-adj-btn" data-team="them" data-action="up">+</button>
                            <button class="manual-adj-btn" data-team="them" data-action="down">-</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bottom-controls-group" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <div class="game-clock">00:00</div>
                <div class="point-timer-container" style="margin: 0; font-size: 0.8rem; opacity: 0.6;"><span class="point-timer-val">00:00</span></div>
                <div class="main-controls">
                    <button id="pause-btn" class="btn ${state.game.isPaused ? 'btn-pause-state' : 'btn-primary'}">${pauseBtnLabel}</button>
                    <button id="reset-btn" class="btn ${resetConfirmPending ? 'btn-accent' : 'btn-ghost'}">${resetConfirmPending ? 'CONFIRM RESET?' : 'RESET GAME'}</button>
                </div>
            </div>
        `;
    }
    renderClock();
    updateUndoButton();
}

function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const target = e.target;

        // Cancel reset confirmation if clicking anywhere else
        if (resetConfirmPending && target.id !== 'reset-btn') {
            clearTimeout(resetConfirmTimeout);
            resetConfirmPending = false;
            render();
        }

        if (target.id === 'pause-btn') togglePause();
        if (target.id === 'reset-btn') resetGame();
        if (target.id === 'undo-btn') undo();
        if (target.id === 'settings-btn') openSettings();
        if (target.id === 'theme-toggle-btn') toggleTheme();
        if (target.id === 'sound-toggle-btn') toggleSound();
        if (target.id === 'fullscreen-btn') toggleFullScreen();
        if (target.id === 'close-settings-btn') document.getElementById('settings-modal').classList.remove('active');
        if (target.id === 'save-settings-btn') saveSettings();
        if (target.closest('.ratio-indicator')) toggleRatio();
        if (target.classList.contains('color-option')) {
            const team = target.dataset.team;
            const color = target.dataset.color;
            state.settings[team === 'us' ? 'teamUsColor' : 'teamThemColor'] = color;
            document.getElementById(`team-${team}-custom-color`).value = color;
            renderColorPickers();
        }
        if (target.classList.contains('fast-score')) scoreGoal(target.dataset.team);
        if (target.classList.contains('score-btn') || target.classList.contains('manual-adj-btn')) {
            target.dataset.action === 'up' ? scoreGoal(target.dataset.team) : adjustScore(target.dataset.team, -1);
        }
    });

    ['team-us-custom-color', 'team-them-custom-color'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const team = id.includes('us') ? 'us' : 'them';
                state.settings[team === 'us' ? 'teamUsColor' : 'teamThemColor'] = e.target.value;
                renderColorPickers();
            });
        }
    });

    const ruleSelect = document.getElementById('ratio-rule');
    if (ruleSelect) {
        ruleSelect.addEventListener('change', (e) => {
            const seqGroup = document.getElementById('ratio-sequence-group');
            if (seqGroup) seqGroup.style.display = (e.target.value === 'MANUAL') ? 'block' : 'none';
        });
    }

    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target.id === 'settings-modal') modal.classList.remove('active'); });
    }

    // Modal Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        const modal = document.getElementById('settings-modal');
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
            } else if (e.key === 'Enter') {
                saveSettings();
            }
        }
    });
}

function init() {
    loadState();
    setupEventListeners();
    requestAnimationFrame(tick);
    render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
