/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

/**
 * Logo styles:
 *  - classic: plump larva + polished AI Coding center panel
 *  - cyber: circular neon emblem (README / website pattern) — not a laptop stack
 */

const B = '\u2588';
const D = '\u2593';
const Up = '\u2580';
const Lo = '\u2584';
const Lf = '\u258C';
const Rt = '\u2590';
const eye = '\u25C9';
const eye2 = '\u25CF';
const eye3 = '\u25D0';
const eye4 = '\u25C8';
const tl = '\u250C';
const tr = '\u2510';
const bl = '\u2514';
const br = '\u2518';
const h = '\u2500';
const v = '\u2502';
const tlB = '\u250F';
const trB = '\u2513';
const blB = '\u2517';
const brB = '\u251B';
const hB = '\u2501';
const vB = '\u2503';

function rows(...lines) { return lines; }

/**
 * Cyber emblem: Soldier Fly Coding AI Agent Larva (readable silhouette).
 * Antennae → plump head → big glowing eyes → neon {} panel on charcoal →
 * friendly smile → small robotic legs. No cluttered HUD rings.
 */
function cyberEmblem(eyeL, eyeR) {
    const C = '\u2591';
    return rows(
        `      \u00b7     \u00b7   `,
        `   ${Lo}${B}${B}${B}${B}${B}${B}${B}${Lo} `,
        `  ${B}${eyeL}${B}${B}${B}${B}${B}${eyeR}${B}`,
        `  ${Lf}${C}${D}${D}{}${D}${D}${C}${Rt}`,
        `  ${B}${B}${B}${B}${B}${B}${B}${B}${B}`,
        `  /| ${Up}\u2570\u256F${Up} |\\ `
    );
}

/** Classic plump larva */
function classicScene(eyeL, eyeR) {
    return rows(
        `   ${Lo}${B}${B}${B}${B}${B}${Lo}  `,
        `  ${B}${eyeL}${B}${B}${B}${eyeR}${B} `,
        `  ${Lf}${D}${D}${D}{}${D}${D}${Rt} `,
        `  ${B}${B}${B}${B}${B}${B}${B}${B} `,
        `   ${Up}${B}${Up} ${Up}${B}${Up}  `
    );
}

/**
 * Classic center panel — Agent Core|
 */
const AI_CODING_BADGE = rows(
    ` ${tlB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${trB} `,
    ` ${vB}\u25C6 AI CODING ${vB} `,
    ` ${vB}  </>  </>  ${vB} `,
    ` ${vB}Agent Core| ${vB} `,
    ` ${blB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${hB}${brB} `
);

const THEME_LARVAE = {
    Lorapok: cyberEmblem(eye, eye),
    Banner: cyberEmblem(eye, eye).map((l, i) => (i === 0 ? l.replace(/\u00b7/g, '#') : l)),
    Slant: cyberEmblem(eye2, eye2),
    Graceful: cyberEmblem(eye3, eye3),
    Executive: cyberEmblem(eye2, eye2).map((l, i) => (i === 0 ? l.replace(/\u00b7/g, '+') : l)),
    Engineering: cyberEmblem(eye, eye),
    Big: cyberEmblem(eye2, eye2).map((l, i) => (i === 0 ? l.replace(/\u00b7/g, '\u2605') : l)),
    Cyberlarge: cyberEmblem(eye, eye).map((l) => l.includes('{') ? l.replace('{', '#{') : l),
    Mini: rows(
        `   \u00b7   \u00b7  `,
        ` ${Lo}${B}${B}${B}${Lo} `,
        `${B}${eye}${B}${eye}${B}`,
        `${Lf}${D}{}${D}${Rt}`,
        `${B}${B}${B}${B}${B}`,
        ` ${Up}\u2570\u256F${Up} `,
        ` /|   |\\ `
    ),
    Roman: cyberEmblem(eye4, eye4)
};

THEME_LARVAE.Engineering = rows(
    `      \u00b7     \u00b7   `,
    `   ${Lo}${B}${B}${B}${B}${B}${B}${B}${Lo} `,
    `  ${B}${eye}${B}${B}${B}${B}${B}${eye}${B}`,
    `  ${Lf}${D}${D}${D}{}${D}${D}${D}${Rt}`,
    `  ${B}${B}${B}${B}${B}${B}${B}${B}${B}`,
    `  || ${Up}\u2570\u256F${Up} || `
);
THEME_LARVAE.Mini = rows(
    `  \u00b7   \u00b7 `,
    ` ${Lo}${B}${B}${B}${Lo}`,
    `${B}${eye}${B}${eye}${B}`,
    `${Lf}${D}{}${D}${Rt}`,
    `${B}${B}${B}${B}${B}`,
    `/|${Up}\u2570\u256F${Up}|\\`
);

const CODING_LARVA = THEME_LARVAE.Lorapok;
const CLASSIC_LARVA = classicScene(eye, eye);

const LOGO_STYLES = {
    cyber: {
        id: 'cyber',
        label: 'Cyber larva',
        hint: 'Soldier-fly coding agent emblem',
        larvaSet: 'cyber'
    },
    classic: {
        id: 'classic',
        label: 'Classic larva',
        hint: 'Plump larva + AI Coding panel',
        larvaSet: 'classic'
    }
};

const CLASSIC_THEME_LARVAE = {
    Lorapok: CLASSIC_LARVA,
    Banner: classicScene(eye, eye),
    Slant: classicScene(eye2, eye2),
    Graceful: classicScene(eye3, eye3),
    Executive: classicScene(eye2, eye2),
    Engineering: classicScene(eye, eye),
    Big: classicScene(eye2, eye2),
    Cyberlarge: classicScene(eye, eye),
    Mini: rows(
        ` ${Lo}${B}${B}${Lo} `,
        `${B}${eye}${eye}${B}`,
        `${Lf}${D}{}${D}${Rt}`,
        ` ${Up}${B}${Up}${B}${Up} `
    ),
    Roman: classicScene(eye4, eye4)
};

const FRAME_VARIANTS = {
    blink: (lines) => lines.map(l => l
        .replace(/\u25C9/g, '\u00B7')
        .replace(/\u25CF/g, '\u25CB')
        .replace(/\u25D0/g, '\u25D1')
        .replace(/\u25C8/g, '\u25C7')),
    pulse: (lines) => lines.map(l => l.replace(/\u00b7/g, '\u2219')),
    idle: (lines) => lines
};

function resolveLogoStyle(styleId = 'classic') {
    return LOGO_STYLES[styleId] || LOGO_STYLES.classic;
}

function getThemeLarvaLines(themeId = 'Lorapok', logoStyle = 'classic') {
    const style = resolveLogoStyle(logoStyle);
    if (style.larvaSet === 'classic') {
        return CLASSIC_THEME_LARVAE[themeId] || CLASSIC_THEME_LARVAE.Lorapok;
    }
    return THEME_LARVAE[themeId] || THEME_LARVAE.Lorapok;
}

function getAiCodingBadge() {
    return AI_CODING_BADGE.slice();
}

function getLarvaComposition(frame = 0, options = {}) {
    const themeId = options.themeId || 'Lorapok';
    const logoStyle = options.logoStyle || 'classic';
    const base = getThemeLarvaLines(themeId, logoStyle);
    let variant = FRAME_VARIANTS.idle(base);
    if (frame % 3 === 1) variant = FRAME_VARIANTS.blink(base);
    if (frame % 3 === 2 && logoStyle === 'cyber') variant = FRAME_VARIANTS.pulse(base);
    return { primary: variant, companions: [], mode: logoStyle, themeId };
}

function colorizeLarvaLines(lines, theme) {
    const primary = theme && theme.chalk && theme.chalk.primary ? theme.chalk.primary : (s) => s;
    const accent = theme && theme.chalk && theme.chalk.accent ? theme.chalk.accent : primary;
    const bug = theme && theme.chalk && theme.chalk.bug ? theme.chalk.bug : primary;
    const muted = theme && theme.chalk && theme.chalk.muted ? theme.chalk.muted : primary;
    const eyeChars = new Set(['\u25C9', '\u25CF', '\u25D0', '\u25D1', '\u25C8', '\u25C7', '\u25CB', '\u00B7', '\u2219']);
    const armor = new Set(['\u2588', '\u2593', '\u2580', '\u2584', '\u258C', '\u2590']);
    const charcoal = new Set(['\u2591', '\u2592']);
    const ring = new Set(['\u2502', '\u2500', '\u2514', '\u2518', '\u2571', '\u2572', '\u2570', '\u256F',
        '\u2501', '\u2550', '#']);
    return lines.map(line => String(line).split('').map(ch => {
        if ('{}#\u2605'.includes(ch) || ch === '+') return accent(ch);
        if (eyeChars.has(ch)) return bug(ch);
        if (charcoal.has(ch)) return muted(ch);
        if (ring.has(ch) || ch === '|') return muted(ch);
        if (ch === '/' || ch === '\\') return muted(ch);
        if (armor.has(ch)) return primary(ch);
        return primary(ch);
    }).join(''));
}

function colorizeBadgeLines(lines, theme) {
    const accent = theme && theme.chalk && theme.chalk.accent ? theme.chalk.accent : (s) => s;
    const muted = theme && theme.chalk && theme.chalk.muted ? theme.chalk.muted : accent;
    const secondary = theme && theme.chalk && theme.chalk.secondary ? theme.chalk.secondary : accent;
    const primary = theme && theme.chalk && theme.chalk.primary ? theme.chalk.primary : accent;
    return lines.map(line => String(line).split('').map(ch => {
        if ('<>/'.includes(ch)) return accent(ch);
        if (ch === '\u25C6') return primary(ch);
        if (/[A-Za-z]/.test(ch)) return secondary(ch);
        if ('┏┓┗┛┃━┌┐└┘─│╭╮╰╯'.includes(ch)) return muted(ch);
        return muted(ch);
    }).join(''));
}

function renderLarvaBlock(frame = 0, theme = null, options = {}) {
    const themeId = (theme && theme.id) || options.themeId || 'Lorapok';
    const logoStyle = options.logoStyle || 'classic';
    const { primary } = getLarvaComposition(frame, { ...options, themeId, logoStyle });
    return colorizeLarvaLines(primary, theme);
}

function renderAiCodingBadge(theme = null) {
    return colorizeBadgeLines(AI_CODING_BADGE, theme);
}

function renderPromptGlyph(theme = null) {
    const accent = theme && theme.chalk && theme.chalk.accent ? theme.chalk.accent : (s) => s;
    return accent('\u25C6');
}

function getLarvaSpinnerFrames() {
    return [
        ' \u25C9\u2588{} ',
        ' \u00B7\u2588{} ',
        ' \u25C9\u2588\u00b7 ',
        ' \u25C6    '
    ];
}

/**
 * Compact farewell emblem for SESSION RECAP (right of METRICS).
 * Small cyber larva + caption — sized to sit beside metrics without dominating.
 * @param {number} [frame=0]
 * @returns {string[]}
 */
function getByeByeEmblemLines(frame = 0) {
    const f = ((frame % 4) + 4) % 4;
    const eyeOpen = '\u25C9';
    const eyeSoft = '\u00B7';
    const eyes = [
        [eyeOpen, eyeOpen],
        [eyeSoft, eyeSoft],
        [eyeOpen, eyeSoft],
        [eyeOpen, eyeOpen]
    ][f];
    const ants = [
        '  \u00B7   \u00B7  ',
        ' \u00B7     \u00B7 ',
        '  \u00B7   \u00B7  ',
        '   \u00B7 \u00B7   '
    ][f];
    // Always keep both words visible; animate surrounding dots only
    const bye = [
        ' bye bye ',
        '\u00B7bye bye\u00B7',
        ' bye bye ',
        '\u00B7bye bye\u00B7'
    ][f];

    return rows(
        ants,
        ` ${Lo}${B}${B}${B}${B}${B}${Lo}`,
        `${B}${eyes[0]}${B}${B}${B}${eyes[1]}${B}`,
        `${Lf}\u2591{}${D}\u2591${Rt}`,
        ` ${Up}${B}${B}${B}${Up} `,
        ' >_code; ',
        bye
    );
}

/**
 * Theme-colored compact bye-bye emblem for recap sidebar.
 * @param {number} [frame=0]
 * @param {Object|null} [theme=null]
 * @returns {string[]}
 */
function renderByeByeEmblem(frame = 0, theme = null) {
    const lines = getByeByeEmblemLines(frame);
    const colored = colorizeLarvaLines(lines, theme);
    const info = theme && theme.chalk && theme.chalk.info
        ? theme.chalk.info
        : (theme && theme.chalk && theme.chalk.accent ? theme.chalk.accent : (s) => s);
    const accent = theme && theme.chalk && theme.chalk.accent ? theme.chalk.accent : info;
    const muted = theme && theme.chalk && theme.chalk.muted ? theme.chalk.muted : accent;
    return colored.map((line, idx) => {
        const plain = lines[idx] || '';
        if (/bye bye/.test(plain)) return info(plain);
        if (plain.includes('>_code;')) return muted(' ') + accent('>_code;') + muted(' ');
        return line;
    });
}

function getByeByeEmblemWidth() {
    return Math.max(...getByeByeEmblemLines(0).map(l => l.length), 1);
}

function getLarvaWidth(themeId = 'Lorapok', logoStyle = 'classic') {
    const lines = getThemeLarvaLines(themeId, logoStyle);
    return Math.max(...lines.map(l => l.length), 1);
}

function listLogoStyles() {
    return Object.values(LOGO_STYLES).map(s => ({
        id: s.id,
        label: s.label,
        hint: s.hint
    }));
}

module.exports = {
    THEME_LARVAE,
    CLASSIC_THEME_LARVAE,
    CODING_LARVA,
    CLASSIC_LARVA,
    AI_CODING_BADGE,
    SOLDIER_FLY: CLASSIC_LARVA,
    LOGO_STYLES,
    PRIMARY_FRAMES: Object.values(THEME_LARVAE),
    COMPANION_FRAMES: [],
    getThemeLarvaLines,
    getAiCodingBadge,
    getLarvaComposition,
    colorizeLarvaLines,
    renderLarvaBlock,
    renderAiCodingBadge,
    renderPromptGlyph,
    getLarvaSpinnerFrames,
    getByeByeEmblemLines,
    renderByeByeEmblem,
    getByeByeEmblemWidth,
    getLarvaWidth,
    resolveLogoStyle,
    listLogoStyles
};
