/**
 * Lorapok AI Coding Agent
 * Copyright (c) 2026 Lorapok Labs (https://lorapok.tech)
 * Licensed under the MIT License
 */
'use strict';

/**
 * Consistent menu / submenu label alignment.
 * Emoji and symbols vary in terminal cell width — pad the icon column
 * so every label starts on the same column.
 */

function stripVariationSelectors(str) {
    return String(str || '').replace(/\uFE0F|\uFE0E/g, '');
}

/**
 * Approximate terminal display columns (emoji / CJK ≈ 2).
 * Misc symbols (♻ ⚙ ← ✓) count as 1 so padIcon can align them with emoji.
 * Known emoji-presentation symbols (⚡ ✨ ❌ …) count as 2.
 * @param {string} str
 * @returns {number}
 */
function termWidth(str) {
    // Misc/Dingbat code points that terminals usually render as double-width emoji
    const WIDE_SYMBOLS = new Set([
        0x26A1, // ⚡
        0x2728, // ✨
        0x2B50, // ⭐
        0x2764, // ❤
        0x2705, // ✅
        0x274C, // ❌
        0x274E, // ❎
        0x2B55, // ⭕
        0x26AA, // ⚪
        0x26AB  // ⚫
    ]);
    let w = 0;
    for (const ch of stripVariationSelectors(str)) {
        const cp = ch.codePointAt(0);
        const wide =
            WIDE_SYMBOLS.has(cp) ||
            (cp >= 0x1100 && cp <= 0x115F) ||
            cp === 0x2329 || cp === 0x232A ||
            (cp >= 0x2E80 && cp <= 0xA4CF && cp !== 0x303F) ||
            (cp >= 0xAC00 && cp <= 0xD7A3) ||
            (cp >= 0xF900 && cp <= 0xFAFF) ||
            (cp >= 0xFE10 && cp <= 0xFE19) ||
            (cp >= 0xFE30 && cp <= 0xFE6F) ||
            (cp >= 0xFF00 && cp <= 0xFF60) ||
            (cp >= 0xFFE0 && cp <= 0xFFE6) ||
            (cp >= 0x1F300 && cp <= 0x1FAFF) ||
            (cp >= 0x1F600 && cp <= 0x1F64F) ||
            (cp >= 0x1F680 && cp <= 0x1F6FF) ||
            (cp >= 0x1F900 && cp <= 0x1F9FF);
        w += wide ? 2 : 1;
    }
    return w;
}

/**
 * Pad an icon to a fixed display-column width.
 * @param {string} icon
 * @param {number} [cols=2]
 * @returns {string}
 */
function padIcon(icon, cols = 2) {
    const ico = stripVariationSelectors(icon) || '•';
    const w = termWidth(ico);
    return ico + ' '.repeat(Math.max(0, cols - w));
}

/**
 * Aligned menu row: `  {icon} {label}`
 * @param {string} icon
 * @param {string} label
 * @param {{ indent?: number, iconCols?: number }} [opts]
 * @returns {string}
 */
function menuMessage(icon, label, opts = {}) {
    const indent = ' '.repeat(opts.indent != null ? opts.indent : 2);
    const iconCols = opts.iconCols != null ? opts.iconCols : 2;
    return `${indent}${padIcon(icon, iconCols)} ${String(label || '')}`;
}

/**
 * Enquirer choice with aligned icon + label.
 * @param {string} name
 * @param {string} icon
 * @param {string} label
 * @param {Object} [extra]
 * @returns {{ name: string, message: string }}
 */
function menuChoice(name, icon, label, extra = {}) {
    const indent = extra.indent;
    const iconCols = extra.iconCols;
    const { indent: _i, iconCols: _c, ...rest } = extra;
    return {
        name,
        message: menuMessage(icon, label, { indent, iconCols }),
        ...rest
    };
}

/**
 * Aligned command row used by slash / system menus.
 * `    {icon} {handlerPadded}  {description}`
 * @param {string} icon
 * @param {string} command
 * @param {string} description
 * @param {Function|null} [chalkBold]
 * @param {Function|null} [chalkMuted]
 * @returns {string}
 */
function commandMenuMessage(icon, command, description, chalkBold = null, chalkMuted = null) {
    const cmd = String(command || '').padEnd(16, ' ');
    const left = `    ${padIcon(icon, 2)} `;
    const mid = chalkBold ? chalkBold(cmd) : cmd;
    const right = description
        ? (chalkMuted ? `  ${chalkMuted(description)}` : `  ${description}`)
        : '';
    return left + mid + right;
}

/**
 * Standard Back choice for menus / submenus.
 * @param {string} [name='back']
 * @param {{ indent?: number }} [opts]
 */
function backChoice(name = 'back', opts = {}) {
    return menuChoice(name, '←', 'Back to previous menu', opts);
}

module.exports = {
    stripVariationSelectors,
    termWidth,
    padIcon,
    menuMessage,
    menuChoice,
    commandMenuMessage,
    backChoice
};
