import { ALLY_PROGRESSION } from '../data/gameConfig.js';

function createMeter(current, max, meterClass, label) {
    const meter = document.createElement('div');
    meter.className = `ally-meter ${meterClass}`;
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-label', label);
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', String(max));
    meter.setAttribute('aria-valuenow', String(current));

    const fill = document.createElement('span');
    fill.style.width = `${max > 0 ? Math.min(100, (current / max) * 100) : 0}%`;
    meter.appendChild(fill);
    return meter;
}

function createStatusLine(label, value, className = '') {
    const line = document.createElement('div');
    line.className = `ally-status-line ${className}`.trim();

    const title = document.createElement('span');
    title.textContent = label;
    const text = document.createElement('b');
    text.textContent = value;

    line.append(title, text);
    return line;
}

export function createAllyStatus(ally, variant = 'card') {
    const level = ally.level ?? 1;
    const health = Math.max(0, ally.health ?? ALLY_PROGRESSION.STARTING_HEALTH);
    const maxHealth = Math.max(1, ally.maxHealth ?? ALLY_PROGRESSION.STARTING_HEALTH);
    const xp = ally.xp ?? 0;
    const xpToNextLevel = Math.max(1, ally.xpToNextLevel ?? ALLY_PROGRESSION.XP_TO_LEVEL_2);
    const status = document.createElement('div');
    status.className = `ally-status ally-status-${variant}${health === 0 ? ' is-knocked-out' : ''}`;

    const heading = document.createElement('div');
    heading.className = 'ally-status-heading';
    const levelLabel = document.createElement('b');
    levelLabel.textContent = `NV ${level}`;
    const xpLabel = document.createElement('span');
    xpLabel.textContent = `${xp}/${xpToNextLevel} XP`;
    heading.append(levelLabel, xpLabel);

    status.append(
        heading,
        createStatusLine('HP', `${health}/${maxHealth}`),
        createMeter(health, maxHealth, 'ally-health-meter', `Vida de ${ally.name}`),
        createMeter(xp, xpToNextLevel, 'ally-xp-meter', `Experiencia de ${ally.name}`)
    );

    if (health === 0) {
        const condition = document.createElement('small');
        condition.className = 'ally-condition is-knocked-out';
        condition.textContent = '💫 Fuera de combate';
        status.appendChild(condition);
    }

    if (ally.poison) {
        const condition = document.createElement('small');
        condition.className = 'ally-condition';
        condition.textContent = `☠️ Envenenado · ${ally.poison.turns}`;
        status.appendChild(condition);
    }

    return status;
}
