(function () {
    'use strict';

    const APP_ID = 'kiara-simulador';
    const STYLE_ID = 'kiara-simulador-style';
    const VERSION = '2.0.0';

    document.getElementById(APP_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();

    const WORLD_SPEED = Number(window.game_data?.speed) || 1;
    const CURRENT_BUILDINGS = window.game_data?.village?.buildings || {};

    const BUILDINGS = {
        main: { name: 'Edificio Principal', max: 30, pop: 5, wood: 90, stone: 80, iron: 70, factor: 1.26 },
        barracks: { name: 'Quartel', max: 25, pop: 7, wood: 200, stone: 170, iron: 90, factor: 1.28 },
        stable: { name: 'Estabulo', max: 20, pop: 8, wood: 270, stone: 240, iron: 260, factor: 1.28 },
        garage: { name: 'Oficina', max: 15, pop: 8, wood: 300, stone: 240, iron: 260, factor: 1.28 },
        smith: { name: 'Ferreiro', max: 20, pop: 20, wood: 220, stone: 180, iron: 240, factor: 1.28 },
        market: { name: 'Mercado', max: 25, pop: 20, wood: 100, stone: 100, iron: 100, factor: 1.28 },
        wood: { name: 'Bosque', max: 30, pop: 5, wood: 50, stone: 60, iron: 40, factor: 1.25 },
        stone: { name: 'Poco de Argila', max: 30, pop: 10, wood: 65, stone: 50, iron: 40, factor: 1.27 },
        iron: { name: 'Mina de Ferro', max: 30, pop: 10, wood: 75, stone: 65, iron: 70, factor: 1.26 },
        farm: { name: 'Fazenda', max: 30, pop: 0, wood: 45, stone: 40, iron: 30, factor: 1.3 },
        storage: { name: 'Armazem', max: 30, pop: 0, wood: 60, stone: 50, iron: 40, factor: 1.265 },
        hide: { name: 'Esconderijo', max: 10, pop: 2, wood: 50, stone: 60, iron: 50, factor: 1.25 },
        wall: { name: 'Muralha', max: 20, pop: 5, wood: 50, stone: 100, iron: 20, factor: 1.26 },
        watchtower: { name: 'Torre de Vigia', max: 20, pop: 500, wood: 12000, stone: 14000, iron: 10000, factor: 1.17 }
    };

    const UNITS = {
        spear: { name: 'Lanceiro', wood: 50, stone: 30, iron: 10, pop: 1 },
        sword: { name: 'Espadachim', wood: 30, stone: 30, iron: 70, pop: 1 },
        axe: { name: 'Machado', wood: 60, stone: 30, iron: 40, pop: 1 },
        archer: { name: 'Arqueiro', wood: 100, stone: 30, iron: 60, pop: 1 },
        spy: { name: 'Explorador', wood: 50, stone: 50, iron: 20, pop: 2 },
        light: { name: 'Cavalaria Leve', wood: 125, stone: 100, iron: 250, pop: 4 },
        marcher: { name: 'Arqueiro a Cavalo', wood: 250, stone: 100, iron: 150, pop: 5 },
        heavy: { name: 'Cavalaria Pesada', wood: 200, stone: 150, iron: 600, pop: 6 },
        ram: { name: 'Ariete', wood: 300, stone: 200, iron: 200, pop: 5 },
        catapult: { name: 'Catapulta', wood: 320, stone: 400, iron: 100, pop: 8 },
        knight: { name: 'Paladino', wood: 20, stone: 20, iron: 40, pop: 10 },
        snob: { name: 'Nobre', wood: 40000, stone: 50000, iron: 50000, pop: 100 }
    };

    const state = {
        buildings: {},
        units: {},
        activeTab: 'buildings'
    };

    Object.keys(BUILDINGS).forEach((id) => {
        const current = clampInt(CURRENT_BUILDINGS[id], 0, BUILDINGS[id].max);
        state.buildings[id] = { current, target: Math.min(BUILDINGS[id].max, current + 1) };
    });
    Object.keys(UNITS).forEach((id) => {
        state.units[id] = 0;
    });

    function clampInt(value, min, max) {
        const parsed = Math.floor(Number(String(value ?? '').replace(/[^\d-]/g, '')));
        if (!Number.isFinite(parsed)) return min;
        return Math.min(max, Math.max(min, parsed));
    }

    function costForLevel(def, level) {
        return {
            wood: Math.round(def.wood * Math.pow(def.factor, level - 1)),
            stone: Math.round(def.stone * Math.pow(def.factor, level - 1)),
            iron: Math.round(def.iron * Math.pow(def.factor, level - 1)),
            pop: Math.round(def.pop * Math.pow(1.17, level - 1))
        };
    }

    function emptyTotal() {
        return { wood: 0, stone: 0, iron: 0, pop: 0 };
    }

    function addToTotal(total, cost, multiplier = 1) {
        total.wood += cost.wood * multiplier;
        total.stone += cost.stone * multiplier;
        total.iron += cost.iron * multiplier;
        total.pop += cost.pop * multiplier;
    }

    function getBuildingTotal() {
        const total = emptyTotal();
        Object.entries(state.buildings).forEach(([id, levels]) => {
            const def = BUILDINGS[id];
            const from = clampInt(levels.current, 0, def.max);
            const to = clampInt(levels.target, 0, def.max);
            if (to <= from) return;
            for (let level = from + 1; level <= to; level += 1) {
                addToTotal(total, costForLevel(def, level));
            }
        });
        return total;
    }

    function getUnitTotal() {
        const total = emptyTotal();
        Object.entries(state.units).forEach(([id, amount]) => {
            const qty = clampInt(amount, 0, 999999);
            if (!qty) return;
            addToTotal(total, UNITS[id], qty);
        });
        return total;
    }

    function formatNumber(value) {
        return Math.round(value).toLocaleString('pt-BR');
    }

    function sumTotal() {
        const buildings = getBuildingTotal();
        const units = getUnitTotal();
        return {
            wood: buildings.wood + units.wood,
            stone: buildings.stone + units.stone,
            iron: buildings.iron + units.iron,
            pop: buildings.pop + units.pop
        };
    }

    function injectStyles() {
        const css = `
            #${APP_ID}{position:fixed;top:80px;left:50%;transform:translateX(-50%);width:min(920px,calc(100vw - 24px));max-height:82vh;z-index:999999;background:#f4e4bc;border:2px solid #7d510f;border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,.45);font-family:Verdana,Arial,sans-serif;color:#2f2212;overflow:hidden}
            #${APP_ID} *{box-sizing:border-box}
            .ks-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:#7d510f;color:#fff}
            .ks-title{font-size:14px;font-weight:700}
            .ks-version{font-size:11px;opacity:.85}
            .ks-close{width:28px;height:28px;border:1px solid rgba(255,255,255,.45);border-radius:4px;background:#5f3d0a;color:#fff;font-weight:700;cursor:pointer}
            .ks-tabs{display:flex;gap:6px;padding:8px 10px;background:#e6cf9c;border-bottom:1px solid #b49355}
            .ks-tab{border:1px solid #9b7b4d;border-radius:4px;background:#f7f0d8;color:#3b2a14;padding:7px 10px;font-weight:700;cursor:pointer}
            .ks-tab.active{background:#8b5a2b;color:#fff}
            .ks-body{padding:10px;overflow:auto;max-height:calc(82vh - 112px)}
            .ks-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
            .ks-btn{border:1px solid #7d510f;border-radius:4px;background:#8b5a2b;color:#fff;padding:7px 10px;font-weight:700;cursor:pointer}
            .ks-btn.secondary{background:#f7f0d8;color:#3b2a14}
            .ks-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:8px}
            .ks-row{display:grid;grid-template-columns:1fr 72px 72px;gap:6px;align-items:center;padding:7px;background:#fff8df;border:1px solid #d5b876;border-radius:4px}
            .ks-row.unit{grid-template-columns:1fr 90px}
            .ks-name{font-weight:700;min-width:0}
            .ks-sub{font-size:11px;color:#6a5330;margin-top:2px}
            .ks-input{width:100%;height:30px;border:1px solid #a88d57;border-radius:4px;background:#fff;padding:4px 6px;text-align:center}
            .ks-summary{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:10px 0}
            .ks-card{background:#fff8df;border:1px solid #d5b876;border-radius:4px;padding:10px}
            .ks-card strong{display:block;font-size:12px;color:#6a3000;margin-bottom:4px}
            .ks-card span{font-size:18px;font-weight:700}
            .ks-note{font-size:11px;color:#614b2c;line-height:1.35;margin-top:8px}
            @media (max-width:620px){#${APP_ID}{top:54px}.ks-row{grid-template-columns:1fr 58px 58px}.ks-summary{grid-template-columns:repeat(2,1fr)}.ks-tab,.ks-btn{padding:7px 8px}}
        `;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    function createShell() {
        const root = document.createElement('div');
        root.id = APP_ID;
        root.innerHTML = `
            <div class="ks-head">
                <div>
                    <div class="ks-title">Simulador de Construcoes e Tropas</div>
                    <div class="ks-version">KIARA v${VERSION} | velocidade do mundo: ${formatNumber(WORLD_SPEED)}x</div>
                </div>
                <button class="ks-close" type="button" data-action="close">X</button>
            </div>
            <div class="ks-tabs">
                <button class="ks-tab active" type="button" data-tab="buildings">Construcoes</button>
                <button class="ks-tab" type="button" data-tab="units">Tropas</button>
                <button class="ks-tab" type="button" data-tab="summary">Resumo</button>
            </div>
            <div class="ks-body"></div>
        `;
        document.body.appendChild(root);
        root.addEventListener('click', onClick);
        root.addEventListener('input', onInput);
        render();
    }

    function onClick(event) {
        const tab = event.target.closest('[data-tab]')?.dataset.tab;
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (tab) {
            state.activeTab = tab;
            render();
            return;
        }
        if (action === 'close') {
            document.getElementById(APP_ID)?.remove();
            document.getElementById(STYLE_ID)?.remove();
            return;
        }
        if (action === 'reset-units') {
            Object.keys(state.units).forEach((id) => {
                state.units[id] = 0;
            });
            render();
            return;
        }
        if (action === 'next-building') {
            Object.keys(BUILDINGS).forEach((id) => {
                const current = state.buildings[id].current;
                state.buildings[id].target = Math.min(BUILDINGS[id].max, current + 1);
            });
            render();
        }
    }

    function onInput(event) {
        const input = event.target;
        const building = input.dataset.building;
        const unit = input.dataset.unit;
        if (building) {
            const field = input.dataset.field;
            const max = BUILDINGS[building].max;
            state.buildings[building][field] = clampInt(input.value, 0, max);
            renderSummaryOnly();
        }
        if (unit) {
            state.units[unit] = clampInt(input.value, 0, 999999);
            renderSummaryOnly();
        }
    }

    function render() {
        const root = document.getElementById(APP_ID);
        if (!root) return;
        root.querySelectorAll('.ks-tab').forEach((button) => {
            button.classList.toggle('active', button.dataset.tab === state.activeTab);
        });
        const body = root.querySelector('.ks-body');
        if (state.activeTab === 'buildings') body.innerHTML = renderBuildings();
        if (state.activeTab === 'units') body.innerHTML = renderUnits();
        if (state.activeTab === 'summary') body.innerHTML = renderSummaryTab();
    }

    function renderSummaryOnly() {
        document.querySelectorAll('[data-summary]').forEach((node) => {
            const total = sumTotal();
            node.innerHTML = summaryCards(total);
        });
    }

    function summaryCards(total) {
        return `
            <div class="ks-card"><strong>Madeira</strong><span>${formatNumber(total.wood)}</span></div>
            <div class="ks-card"><strong>Argila</strong><span>${formatNumber(total.stone)}</span></div>
            <div class="ks-card"><strong>Ferro</strong><span>${formatNumber(total.iron)}</span></div>
            <div class="ks-card"><strong>Populacao</strong><span>${formatNumber(total.pop)}</span></div>
        `;
    }

    function renderBuildings() {
        const rows = Object.entries(BUILDINGS).map(([id, def]) => {
            const item = state.buildings[id];
            return `
                <div class="ks-row">
                    <div class="ks-name">${def.name}<div class="ks-sub">max. ${def.max}</div></div>
                    <input class="ks-input" data-building="${id}" data-field="current" type="number" min="0" max="${def.max}" value="${item.current}" title="Nivel atual">
                    <input class="ks-input" data-building="${id}" data-field="target" type="number" min="0" max="${def.max}" value="${item.target}" title="Nivel alvo">
                </div>
            `;
        }).join('');
        return `
            <div class="ks-toolbar">
                <button class="ks-btn secondary" type="button" data-action="next-building">Alvo +1 em tudo</button>
                <span class="ks-note">Colunas: nivel atual e nivel alvo.</span>
            </div>
            <div class="ks-summary" data-summary>${summaryCards(sumTotal())}</div>
            <div class="ks-grid">${rows}</div>
            <div class="ks-note">Valores sao estimativas baseadas nos custos padrao do Tribal Wars. Mundos especiais podem ter ajustes.</div>
        `;
    }

    function renderUnits() {
        const rows = Object.entries(UNITS).map(([id, def]) => `
            <div class="ks-row unit">
                <div class="ks-name">${def.name}<div class="ks-sub">${def.wood}/${def.stone}/${def.iron} | pop ${def.pop}</div></div>
                <input class="ks-input" data-unit="${id}" type="number" min="0" max="999999" value="${state.units[id]}" title="Quantidade">
            </div>
        `).join('');
        return `
            <div class="ks-toolbar">
                <button class="ks-btn secondary" type="button" data-action="reset-units">Zerar tropas</button>
            </div>
            <div class="ks-summary" data-summary>${summaryCards(sumTotal())}</div>
            <div class="ks-grid">${rows}</div>
        `;
    }

    function renderSummaryTab() {
        const buildings = getBuildingTotal();
        const units = getUnitTotal();
        const total = sumTotal();
        return `
            <div class="ks-summary" data-summary>${summaryCards(total)}</div>
            <div class="ks-grid">
                <div class="ks-card">
                    <strong>Construcoes</strong>
                    Madeira: ${formatNumber(buildings.wood)}<br>
                    Argila: ${formatNumber(buildings.stone)}<br>
                    Ferro: ${formatNumber(buildings.iron)}<br>
                    Populacao: ${formatNumber(buildings.pop)}
                </div>
                <div class="ks-card">
                    <strong>Tropas</strong>
                    Madeira: ${formatNumber(units.wood)}<br>
                    Argila: ${formatNumber(units.stone)}<br>
                    Ferro: ${formatNumber(units.iron)}<br>
                    Populacao: ${formatNumber(units.pop)}
                </div>
            </div>
            <div class="ks-note">Dica: como o menu KIARA carrega este arquivo por uma URL fixa, corrigir o arquivo no GitHub ja faz o botao voltar a funcionar para todo mundo apos o cache do CDN atualizar.</div>
        `;
    }

    injectStyles();
    createShell();
})();
