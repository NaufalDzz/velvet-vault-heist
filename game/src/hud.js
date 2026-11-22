import { computeGetawayGrade } from './engine.js';

function renderPips(el, count, maxCount, onClass) {
  let html = '';
  for (let i = 0; i < maxCount; i++) {
    html += `<i class="${i < count ? onClass : ''}"></i>`;
  }
  el.innerHTML = html;
}

export function createHudBinder(elements) {
  let lastAlarmBucket = -1;
  let lastPhase = '';

  return function syncHud(state, muted) {
    elements.wingName.textContent = `${state.wingCode} · ${state.wingName}`;
    for (const btn of elements.wingBtns) {
      btn.classList.toggle('active', Number(btn.dataset.wing) === state.wingIndex);
    }

    const mainLoot = state.loots.find((l) => l.primary);
    if (state.phase === 'getaway') {
      elements.objectiveText.textContent = 'Clean Extraction Complete';
    } else if (state.phase === 'caught') {
      elements.objectiveText.textContent = 'Syndicate Lockdown — Press [R] to Retry';
    } else if (state.primaryLootStolen) {
      elements.objectiveText.textContent = `Loot Secured! Escape via ${state.extract.label}`;
    } else {
      elements.objectiveText.textContent = `Lift ${mainLoot ? mainLoot.name : 'Vault Artifact'} ($${Math.round((mainLoot?.value ?? 250000) / 1000)}K)`;
    }

    elements.coverPill.hidden = !(state.player.inCover && state.phase === 'playing');

    // Alarm meter & segmented gauge
    const pct = Math.round(state.alarm);
    let tier = 'calm';
    let label = 'CALM';
    if (pct >= 100) {
      tier = 'lockdown';
      label = 'LOCKDOWN';
    } else if (pct >= 70) {
      tier = 'alert';
      label = 'HIGH ALERT';
    } else if (pct >= 30) {
      tier = 'caution';
      label = 'CAUTION';
    }
    elements.alarmModule.dataset.tier = tier;
    elements.alarmValue.textContent = `${pct}% · ${label}`;

    const litCount = pct === 0 ? 0 : Math.max(1, Math.ceil(pct / 10));
    if (litCount !== lastAlarmBucket) {
      lastAlarmBucket = litCount;
      const segs = elements.alarmSegments.children;
      for (let i = 0; i < segs.length; i++) {
        segs[i].className = '';
        if (i < litCount) {
          segs[i].className = pct >= 70 ? 'lit-alert' : pct >= 30 ? 'lit-caution' : 'lit-calm';
        }
      }
    }

    elements.haulValue.textContent = `$${Math.round(state.haul / 1000)}K`;
    elements.muteBtn.classList.toggle('muted', muted);
    elements.muteBtn.textContent = muted ? '[M] MUTED' : '[M] AUDIO';

    // Gadget dock pips
    renderPips(elements.empPips, state.gadgets.emp, state.maxGadgets.emp, 'on-emp');
    renderPips(elements.decoyPips, state.gadgets.decoy, state.maxGadgets.decoy, 'on-decoy');
    renderPips(elements.smokePips, state.gadgets.smoke, state.maxGadgets.smoke, 'on-smoke');

    elements.btnEmp.classList.toggle('depleted', state.gadgets.emp <= 0);
    elements.btnDecoy.classList.toggle('depleted', state.gadgets.decoy <= 0);
    elements.btnDecoy.classList.toggle('armed', state.armedTool === 'decoy');
    elements.btnSmoke.classList.toggle('depleted', state.gadgets.smoke <= 0);

    if (state.phase === 'getaway') {
      elements.btnInteract.classList.remove('ready-interact');
      elements.interactLabel.textContent = 'EXFILTRATED';
      elements.interactSub.textContent = 'Clean getaway';
    } else if (state.phase === 'caught') {
      elements.btnInteract.classList.remove('ready-interact');
      elements.interactLabel.textContent = 'LOCKDOWN';
      elements.interactSub.textContent = 'Press [R] to retry';
    } else if (state.nearestInteract) {
      elements.btnInteract.classList.add('ready-interact');
      elements.interactLabel.textContent = state.nearestInteract.label;
      elements.interactSub.textContent = 'Press [E] now';
    } else {
      elements.btnInteract.classList.remove('ready-interact');
      elements.interactLabel.textContent = 'HACK / LOOT';
      elements.interactSub.textContent = state.primaryLootStolen ? 'Reach escape hatch' : 'Move near target';
    }

    // Debrief card for Caught / Getaway
    if (state.phase === 'caught') {
      elements.debriefCard.hidden = false;
      elements.debriefCard.className = 'debrief-card caught-theme';
      elements.debriefKicker.textContent = 'ALARM 100% · SYNDICATE LOCKDOWN';
      elements.debriefHeading.textContent = 'HEIST COMPROMISED';
      elements.debriefReason.textContent = state.caughtInfo?.reason ?? 'Security spotted you in a restricted zone.';
      elements.debriefStats.innerHTML = `
        <div class="debrief-stat-row"><span>WING</span><strong>${state.wingCode}</strong></div>
        <div class="debrief-stat-row"><span>TIME</span><strong>${state.elapsed.toFixed(1)}s</strong></div>
        <div class="debrief-stat-row"><span>HAUL HELD</span><strong>$${Math.round(state.haul / 1000)}K</strong></div>
        <div class="debrief-stat-row"><span>TOOLS USED</span><strong>${state.toolsUsedCount}</strong></div>
      `;
      elements.btnDebriefPrimary.textContent = '[R] INSTANT RETRY';
      elements.btnDebriefNext.hidden = true;
    } else if (state.phase === 'getaway') {
      const { rank, stealthBonus } = computeGetawayGrade(state);
      elements.debriefCard.hidden = false;
      elements.debriefCard.className = 'debrief-card getaway-theme';
      elements.debriefKicker.textContent = `RANK ${rank} · ${stealthBonus} EXFILTRATION`;
      elements.debriefHeading.textContent = 'CLEAN GETAWAY';
      elements.debriefReason.textContent = `${state.wingName} cleared with $${state.haul.toLocaleString()} in Syndicate assets.`;
      elements.debriefStats.innerHTML = `
        <div class="debrief-stat-row"><span>RANK</span><strong>${rank} (${stealthBonus})</strong></div>
        <div class="debrief-stat-row"><span>FINAL HAUL</span><strong>$${Math.round(state.haul / 1000)}K</strong></div>
        <div class="debrief-stat-row"><span>PEAK ALARM</span><strong>${Math.round(state.alarm)}%</strong></div>
        <div class="debrief-stat-row"><span>TIME</span><strong>${state.elapsed.toFixed(1)}s</strong></div>
      `;
      elements.btnDebriefPrimary.textContent = '[R] REPLAY WING';
      elements.btnDebriefNext.hidden = state.wingIndex >= 2;
    } else {
      elements.debriefCard.hidden = true;
    }

    if (lastPhase !== state.phase) {
      lastPhase = state.phase;
      elements.ariaStatus.textContent = `${state.wingCode} ${state.wingName}: ${state.statusNote}`;
    }
  };
}
