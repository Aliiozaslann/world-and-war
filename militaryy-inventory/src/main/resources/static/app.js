// --- 1. STATİK / YEDEK ASKERİ VERİTABANI ---
const militaryData = {
    "USA": {
        name: "Amerika Birleşik Devletleri",
        flag: "🇺🇸",
        rank: "Global Sıralama: #1",
        personnel: "1.390.000",
        tanks: "4.545",
        apv: "27.300",
        artillery: "1.625",
        mbtTotal: "4.545",
        mbt: [
            { name: "M1A2 SEPv3 / SEPv2 Abrams", count: "2.645 ad." },
            { name: "M1A1 Abrams", count: "1.900 ad." }
        ],
        afvTotal: "27.300",
        afv: [
            { name: "M2A3/A4 Bradley (ZMA)", count: "4.500 ad." },
            { name: "M1126 Stryker (8x8)", count: "2.900 ad." },
            { name: "M113A3", count: "5.000 ad." },
            { name: "JLTV / Oshkosh (MRAP)", count: "14.500 ad." },
            { name: "AMPV", count: "400 ad." }
        ],
        spgTotal: "990",
        spg: [{ name: "M109A6 / A7 Paladin (155mm)", count: "990 ad." }],
        mlrsTotal: "635",
        mlrs: [
            { name: "M142 HIMARS", count: "410 ad." },
            { name: "M270A1/A2 MLRS", count: "225 ad." }
        ]
    },
    "TUR": {
        name: "Türkiye",
        flag: "🇹🇷",
        rank: "Global Sıralama: #8",
        personnel: "425.000",
        tanks: "2.231",
        apv: "11.200",
        artillery: "1.850",
        mbtTotal: "2.231",
        mbt: [
            { name: "Altay T1 / T2", count: "250 ad." },
            { name: "Leopard 2A4 (TİYK)", count: "340 ad." },
            { name: "M60T Sabra", count: "165 ad." }
        ],
        afvTotal: "11.200",
        afv: [
            { name: "FNSS Pars / Arma (8x8)", count: "1.200 ad." },
            { name: "ACV-15 / ZMA", count: "2.500 ad." },
            { name: "BMC Vuran / Kirpi II", count: "3.400 ad." }
        ],
        spgTotal: "350",
        spg: [{ name: "T-155 Fırtına I / II", count: "350 ad." }],
        mlrsTotal: "180",
        mlrs: [{ name: "TRG-300 Kaplan / Sakarya", count: "180 ad." }]
    }
};

let allCountries = [];
let activeId = null;
let compareId = null;
let activeTab = 'land';
let isCompareMode = false;
let isAllianceMode = false;
let isScenarioMode = false;
let allianceSide1 = [];
let allianceSide2 = [];
let radarChartInstance = null;
let radarChartDrawTimer = null;
let worldGlobe = null;

function toFiniteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function destroyRadarChart() {
    if (radarChartDrawTimer !== null) {
        clearTimeout(radarChartDrawTimer);
        radarChartDrawTimer = null;
    }

    const canvas = document.getElementById('radarChart');

    if (radarChartInstance) {
        try {
            radarChartInstance.destroy();
        } catch (error) {
            console.warn('Radar grafik temizlenemedi:', error);
        }
        radarChartInstance = null;
    }

    if (canvas && typeof Chart !== 'undefined' && typeof Chart.getChart === 'function') {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) existingChart.destroy();
    }
}

function resetAllianceSelection() {
    allianceSide1 = [];
    allianceSide2 = [];
    updateAllianceSlots();
}

// --- 2. 3D DÜNYA KÜRESİ BAŞLATMA (GLOBE.GL) ---
function init3DGlobe() {
    const elem = document.getElementById('globeViz');
    if (!elem) return;

    worldGlobe = Globe()(elem)
        .backgroundColor('#070b14')
        .showAtmosphere(true)
        .atmosphereColor('#38bdf8')
        .atmosphereAltitude(0.15)
        .polygonCapColor(() => '#1e293b')
        .polygonSideColor(() => 'rgba(15, 23, 42, 0.5)')
        .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.15)')
        .polygonAltitude(0.01);

    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        .then(res => res.json())
        .then(countries => {
            worldGlobe.polygonsData(countries.features)
                .polygonLabel(({ properties: d }) => `
                    <div style="background: rgba(11, 17, 32, 0.95); padding: 6px 12px; border-radius: 8px; border: 1px solid #f97316; color: #fff; font-family: sans-serif; font-size: 11px; box-shadow: 0 0 15px rgba(249,115,22,0.3);">
                        <b style="color: #fbbf24;">${d.NAME}</b> (Tıkla ve İncele)
                    </div>
                `)
                .onPolygonHover(hoverD => worldGlobe
                    .polygonCapColor(d => d === hoverD ? '#f97316' : '#1e293b')
                    .polygonAltitude(d => d === hoverD ? 0.05 : 0.01)
                )
                .onPolygonClick(({ properties: d }) => {
                    const countryCode = d.ISO_A3 || d.ADM0_A3 || "";
                    const nameLower = d.NAME.toLowerCase();

                    // Önce Java API'sinden gelen liste içinde ara
                    const apiCountry = allCountries.find(c =>
                        c.name.toLowerCase() === nameLower ||
                        c.id.toLowerCase() === nameLower ||
                        (d.ISO_A2 && c.flagCode && c.flagCode.toLowerCase() === d.ISO_A2.toLowerCase())
                    );

                    if (apiCountry) {
                        if (isCompareMode) exitCompareMode();
                        showDetail(apiCountry.id);
                        document.getElementById('detailSection').scrollIntoView({ behavior: 'smooth' });
                    } else {
                        loadCountryData(countryCode, d.NAME);
                    }
                });
        })
        .catch(err => console.warn("Globe GeoJSON yüklenemedi:", err));

    worldGlobe.controls().autoRotate = true;
    worldGlobe.controls().autoRotateSpeed = 0.15;
    worldGlobe.pointOfView({ lat: 20, lng: 0, altitude: 2.15 }, 0);

    window.addEventListener('resize', () => {
        if (worldGlobe && elem) {
            worldGlobe.width(elem.clientWidth);
            worldGlobe.height(elem.clientHeight);
        }
    });
}

function loadCountryData(code, defaultName) {
    const data = militaryData[code] || {
        name: defaultName,
        flag: "🌐",
        rank: "Global Sıralama: N/A",
        personnel: "Veri Yok",
        tanks: "-", apv: "-", artillery: "-",
        mbtTotal: "-", mbt: [],
        afvTotal: "-", afv: [],
        spgTotal: "-", spg: [],
        mlrsTotal: "-", mlrs: []
    };

    const country = allCountries.find(c => c.name.toLowerCase() === data.name.toLowerCase());
    if (country) {
        if (isCompareMode) exitCompareMode();
        showDetail(country.id);
        document.getElementById('detailSection').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const header = document.getElementById('countryHeader');
    if (header) {
        header.innerHTML = `
            <div class="military-header">
                <div class="country-title-box">
                    <span class="flag-icon">${data.flag}</span>
                    <div>
                        <h1>${data.name}</h1>
                        <span class="rank-badge">${data.rank}</span>
                    </div>
                </div>
                <div class="header-actions">
                    <div class="personnel-box">
                        <span class="label">AKTİF PERSONEL</span>
                        <span class="value">${data.personnel}</span>
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById('detailSection').scrollIntoView({ behavior: 'smooth' });
}

// --- 3. JAVA BACKEND'DEN VERİ ÇEKME & INIT ---
async function init() {
    try {
        init3DGlobe();

        // Java Spring Boot REST Controller endpointi
        const res = await fetch('/api/countries');
        if (!res.ok) throw new Error('Java API Hatası');
        allCountries = await res.json();

        renderList(allCountries);

        if (allCountries.length > 0) {
            const defaultCountry = allCountries.find(c => c.id === 'turkey') || allCountries[0];
            showDetail(defaultCountry.id);
        }
    } catch (err) {
        console.error("Veri çekilemedi:", err);
    }
}

function renderList(list) {
    const container = document.getElementById('countryList');
    if (!container) return;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div class="text-slate-500 p-4 text-center text-xs">Ülke bulunamadı.</div>';
        return;
    }

    list.forEach(c => {
        const isSelected = c.id === activeId;
        const div = document.createElement('div');
        div.className = `p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
            isSelected
                ? 'bg-slate-800/90 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50 translate-x-1'
                : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700'
        }`;

        div.onclick = () => {
            if (isCompareMode) exitCompareMode();
            showDetail(c.id);

            if (window.innerWidth < 1024) {
                const detailSec = document.getElementById('detailSection');
                if (detailSec) {
                    detailSec.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        div.innerHTML = `
            <div class="flex items-center space-x-3 pointer-events-none">
                <span class="font-bold font-mono text-amber-500 w-6 text-center text-xs">#${c.rank}</span>
                <img src="https://flagcdn.com/w40/${c.flagCode}.png" alt="${c.name}" class="w-6 h-4 rounded object-cover shadow-sm">
                <div>
                    <div class="font-semibold text-slate-200 text-sm leading-tight">${c.name}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5 font-mono">${(c.activePersonnel || 0).toLocaleString()} Aktif</div>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right text-xs pointer-events-none ${isSelected ? 'text-amber-500' : 'text-slate-600'}"></i>
        `;
        container.appendChild(div);
    });
}

function setTab(tab) {
    activeTab = tab;
    ['land', 'air', 'naval', 'airDefense'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = "tab-btn active px-4 py-2 rounded-xl border border-amber-500/50 text-amber-400 text-xs font-bold uppercase tracking-wider transition flex items-center space-x-2";
            } else {
                btn.className = "tab-btn px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider transition hover:text-slate-200 flex items-center space-x-2";
            }
        }
    });
    renderForceContent();
}

function showDetail(countryId) {
    activeId = countryId;
    renderList(getFilteredList());

    const country = allCountries.find(c => c.id === countryId);
    if (!country) return;

    document.getElementById('countryHeader').innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 mb-5 gap-4">
            <div class="flex items-center space-x-4">
                <img src="https://flagcdn.com/w80/${country.flagCode}.png" alt="${country.name}" class="w-16 h-11 rounded-lg shadow-md border border-slate-700 object-cover">
                <div>
                    <h3 class="text-3xl font-extrabold text-slate-100 tracking-wide">${country.name}</h3>
                    <span class="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">Global Sıralama: #${country.rank}</span>
                </div>
            </div>
            <div class="flex items-center flex-wrap gap-2.5">
                <div class="bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl text-right">
                    <span class="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">Aktif Personel</span>
                    <span class="text-xl font-bold font-mono text-amber-400">${(country.activePersonnel || 0).toLocaleString()}</span>
                </div>
                <button onclick="openCompareModal()" class="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center space-x-2 shadow-lg">
                    <i class="fa-solid fa-code-compare"></i>
                    <span>Başka Ülkeyle Karşılaştır</span>
                </button>
                <button onclick="openAllianceModal()" class="bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center space-x-2 shadow-lg">
                    <i class="fa-solid fa-users-rays text-indigo-400"></i>
                    <span>Müttefiklerle Savaş</span>
                </button>
            </div>
        </div>
    `;

    renderForceContent();
}

const sumMap = (map) => {
    if (!map || typeof map !== 'object') return 0;
    return Object.values(map).reduce((total, value) => total + toFiniteNumber(value), 0);
};

function calculateForceScore(country) {
    if (!country) {
        return {
            landScore: 0,
            airScore: 0,
            navalScore: 0,
            airDefenseScore: 0,
            droneScore: 0,
            artilleryScore: 0,
            total: 0
        };
    }

    const land = country.landForces || {};
    const air = country.airForces || {};
    const naval = country.navalForces || {};
    const airDefense = getAirDefenseData(country);

    const personnel = toFiniteNumber(country.activePersonnel);
    const tanks = sumMap(land.mainBattleTanks);
    const armored = sumMap(land.armoredVehicles);
    const artillery = sumMap(land.selfPropelledArtillery);
    const rockets = sumMap(land.rocketArtillery);
    const fighters = sumMap(air.fighterAircraft);
    const attackHelis = sumMap(air.attackHelicopters);
    const drones = sumMap(air.ucavAndDrones);
    const transports = sumMap(air.transportAndTanker);
    const carriers = sumMap(naval.aircraftCarriers);
    const submarines = sumMap(naval.submarines);
    const frigates = sumMap(naval.destroyersAndFrigates);
    const corvettes = sumMap(naval.corvettesAndPatrol);
    const samLong = sumMap(airDefense.strategicLongRange);
    const samMid = sumMap(airDefense.mediumShortRange);
    const samPoint = sumMap(airDefense.pointDefenseAndGun);

    const landScore = personnel / 10000 + tanks * 8 + armored * 1.5 + artillery * 4 + rockets * 6;
    const airScore = fighters * 12 + attackHelis * 7 + drones * 2 + transports;
    const navalScore = carriers * 80 + submarines * 15 + frigates * 8 + corvettes * 3;
    const airDefenseScore = samLong * 12 + samMid * 7 + samPoint * 2;
    const droneScore = drones * 3;
    const artilleryScore = artillery * 5 + rockets * 7;
    const total = landScore * 0.26 + airScore * 0.25 + navalScore * 0.18 + airDefenseScore * 0.18 + droneScore * 0.07 + artilleryScore * 0.06;

    return { landScore, airScore, navalScore, airDefenseScore, droneScore, artilleryScore, total };
}

function getAirDefenseData(country) {
    if (country && country.airDefense) {
        return {
            strategicLongRange: country.airDefense.strategicLongRange || {},
            mediumShortRange: country.airDefense.mediumShortRange || {},
            pointDefenseAndGun: country.airDefense.pointDefenseAndGun || {}
        };
    }
    return {
        strategicLongRange: {},
        mediumShortRange: {},
        pointDefenseAndGun: {}
    };
}

function renderForceContent() {
    const country = allCountries.find(c => c.id === activeId);
    if (!country) return;

    const container = document.getElementById('detailContent');

    if (activeTab === 'land') {
        const lf = country.landForces || {};
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Tank Gücü</span>
                    <span class="text-2xl font-bold font-mono text-slate-100">${sumMap(lf.mainBattleTanks).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Zırhlı Muharebe & Taşıyıcı</span>
                    <span class="text-2xl font-bold font-mono text-slate-100">${sumMap(lf.armoredVehicles).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Obüs & ÇNRA Füze</span>
                    <span class="text-2xl font-bold font-mono text-slate-100">${(sumMap(lf.selfPropelledArtillery) + sumMap(lf.rocketArtillery)).toLocaleString()}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                ${createCategoryBox('Ana Muharebe Tankları (MBT)', 'fa-solid fa-shield-halved', lf.mainBattleTanks)}
                ${createCategoryBox('Zırhlı Muharebe & Taşıyıcılar', 'fa-solid fa-truck-monster', lf.armoredVehicles)}
                ${createCategoryBox('Kundağı Motorlu Obüsler', 'fa-solid fa-crosshairs', lf.selfPropelledArtillery)}
                ${createCategoryBox('Çok Namlulu Roketatar / ÇNRA', 'fa-solid fa-rocket', lf.rocketArtillery)}
            </div>
        `;
    } else if (activeTab === 'air') {
        const af = country.airForces || {};
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Muharip / Avcı Uçaklar</span>
                    <span class="text-2xl font-bold font-mono text-sky-400">${sumMap(af.fighterAircraft).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Taarruz Helikopterleri</span>
                    <span class="text-2xl font-bold font-mono text-sky-400">${sumMap(af.attackHelicopters).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">SİHA & İHA Filosu</span>
                    <span class="text-2xl font-bold font-mono text-sky-400">${sumMap(af.ucavAndDrones).toLocaleString()}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                ${createCategoryBox('Av / Muharebe Uçakları', 'fa-solid fa-jet-fighter', af.fighterAircraft)}
                ${createCategoryBox('Taarruz Helikopterleri', 'fa-solid fa-helicopter', af.attackHelicopters)}
                ${createCategoryBox('SİHA ve Keşif İHA Filosu', 'fa-solid fa-satellite-dish', af.ucavAndDrones)}
                ${createCategoryBox('Stratejik Nakliye & Tanker Uçaklar', 'fa-solid fa-plane-departure', af.transportAndTanker)}
            </div>
        `;
    } else if (activeTab === 'naval') {
        const nf = country.navalForces || {};
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Uçak & Amfibi Gemiler (LHD)</span>
                    <span class="text-2xl font-bold font-mono text-teal-400">${sumMap(nf.aircraftCarriers).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Denizaltı Gücü</span>
                    <span class="text-2xl font-bold font-mono text-teal-400">${sumMap(nf.submarines).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Suüstü Muharip Gemiler</span>
                    <span class="text-2xl font-bold font-mono text-teal-400">${(sumMap(nf.destroyersAndFrigates) + sumMap(nf.corvettesAndPatrol)).toLocaleString()}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                ${createCategoryBox('Uçak & Amfibi Hücum Gemileri', 'fa-solid fa-ship', nf.aircraftCarriers)}
                ${createCategoryBox('Denizaltılar', 'fa-solid fa-water', nf.submarines)}
                ${createCategoryBox('Muhrip & Fırkateynler', 'fa-solid fa-anchor', nf.destroyersAndFrigates)}
                ${createCategoryBox('Korvet, Hücumbot & Devriye', 'fa-solid fa-compass', nf.corvettesAndPatrol)}
            </div>
        `;
    } else if (activeTab === 'airDefense') {
        const ad = getAirDefenseData(country);
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Stratejik Uzun Menzilli SAM</span>
                    <span class="text-2xl font-bold font-mono text-emerald-400">${sumMap(ad.strategicLongRange).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Orta & Alçak İrtifa Sistemleri</span>
                    <span class="text-2xl font-bold font-mono text-emerald-400">${sumMap(ad.mediumShortRange).toLocaleString()}</span>
                </div>
                <div class="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-center">
                    <span class="text-xs text-slate-400 block mb-1">Nokta Savunma & Uçaksavar Top</span>
                    <span class="text-2xl font-bold font-mono text-emerald-400">${sumMap(ad.pointDefenseAndGun).toLocaleString()}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                ${createCategoryBox('Uzun Menzil / Balistik Füze Savunma', 'fa-solid fa-tower-broadcast', ad.strategicLongRange)}
                ${createCategoryBox('Orta & Alçak İrtifa Hava Savunması', 'fa-solid fa-shield-virus', ad.mediumShortRange)}
                ${createCategoryBox('Nokta & C-RAM Hava Savunma', 'fa-solid fa-crosshairs', ad.pointDefenseAndGun)}
            </div>
        `;
    }
}

function createCategoryBox(title, icon, items) {
    if (!items || Object.keys(items).length === 0) {
        return `
            <div class="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                <div class="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800/60">
                    <i class="${icon} text-amber-500 text-sm"></i>
                    <h4 class="font-semibold text-slate-200 text-xs uppercase tracking-wider">${title}</h4>
                </div>
                <div class="text-xs text-slate-500 italic py-2">Envanterde kayıt bulunmuyor.</div>
            </div>
        `;
    }

    const total = sumMap(items);
    const rows = Object.entries(items).map(([model, count]) => `
        <div onclick="showSpecPopup('${model.replace(/'/g, "\\'")}')"
             class="group flex justify-between items-center py-2.5 px-3 hover:bg-slate-800/80 hover:border-amber-500/50 rounded-xl transition-all text-xs border border-transparent border-b-slate-800/40 last:border-b-transparent cursor-pointer">
            <span class="text-slate-300 font-medium group-hover:text-amber-400 flex items-center space-x-2.5">
                <i class="fa-solid fa-circle-info text-xs text-slate-500 group-hover:text-amber-400"></i>
                <span class="text-sm font-semibold">${model}</span>
            </span>
            <span class="text-amber-400 font-bold font-mono bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/60">${Number(count).toLocaleString()} adet</span>
        </div>
    `).join('');

    return `
        <div class="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
                <div class="flex items-center space-x-2.5">
                    <i class="${icon} text-amber-500 text-base"></i>
                    <h4 class="font-bold text-slate-200 text-sm uppercase tracking-wider">${title}</h4>
                </div>
                <span class="text-xs text-slate-400 font-mono">Toplam: <strong class="text-amber-400 font-bold">${total.toLocaleString()}</strong></span>
            </div>
            <div class="space-y-1">${rows}</div>
        </div>
    `;
}

function showSpecPopup(modelName) {
    let spec = generateHeuristicSpec(modelName);

    document.getElementById('specTitle').innerText = spec.title;
    document.getElementById('specCategory').innerText = spec.category;
    document.getElementById('specOrigin').innerText = spec.origin;
    document.getElementById('specSpeed').innerText = spec.speed;
    document.getElementById('specRange').innerText = spec.range;
    document.getElementById('specArmament').innerText = spec.armament;
    document.getElementById('specDesc').innerText = spec.desc;

    document.getElementById('specModal').classList.remove('hidden');
}

function closeSpecModal() {
    document.getElementById('specModal').classList.add('hidden');
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('specModal');
    if (e.target === modal) closeSpecModal();
});

function openCompareModal() {
    document.getElementById('compareModal').classList.remove('hidden');
    renderModalList(allCountries.filter(c => c.id !== activeId));
}

function closeCompareModal() {
    document.getElementById('compareModal').classList.add('hidden');
}

function renderModalList(list) {
    const container = document.getElementById('modalCountryList');
    container.innerHTML = '';

    list.forEach(c => {
        const div = document.createElement('div');
        div.className = "p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/70 hover:border-amber-500/60 cursor-pointer transition flex items-center justify-between";
        div.onclick = () => {
            closeCompareModal();
            startComparison(c.id);
        };
        div.innerHTML = `
            <div class="flex items-center space-x-3 pointer-events-none">
                <span class="font-bold text-amber-500 text-xs w-6">#${c.rank}</span>
                <img src="https://flagcdn.com/w40/${c.flagCode}.png" alt="${c.name}" class="w-6 h-4 rounded object-cover shadow">
                <span class="font-semibold text-slate-200 text-sm">${c.name}</span>
            </div>
            <i class="fa-solid fa-plus text-xs text-slate-500"></i>
        `;
        container.appendChild(div);
    });
}

document.getElementById('modalSearchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allCountries.filter(c => c.id !== activeId && c.name.toLowerCase().includes(term));
    renderModalList(filtered);
});

function startComparison(secondCountryId) {
    const secondCountry = allCountries.find(c => c.id === secondCountryId);
    if (!secondCountry || secondCountry.id === activeId) return;

    destroyRadarChart();
    allianceSide1 = [];
    allianceSide2 = [];
    isCompareMode = true;
    isAllianceMode = false;
    isScenarioMode = false;
    compareId = secondCountry.id;

    document.getElementById('compareViewTitle').innerText = "Askeri Doktrin & Güç Karşılaştırması";
    document.getElementById('singleView').classList.add('hidden');
    document.getElementById('compareView').classList.remove('hidden');
    renderSingleCompare();
}

function openAllianceModal() {
    resetAllianceSelection();
    const cur = allCountries.find(c => c.id === activeId);

    if (cur) allianceSide1.push(cur);

    document.getElementById('allianceModal').classList.remove('hidden');
    updateAllianceSlots();
    renderAllianceCountryPool(allCountries);
}

function closeAllianceModal() {
    document.getElementById('allianceModal').classList.add('hidden');
    const searchInput = document.getElementById('allianceSearchInput');
    if (searchInput) searchInput.value = '';
}

function updateAllianceSlots() {
    document.getElementById('side1Count').innerText = `${allianceSide1.length}/3`;
    document.getElementById('side2Count').innerText = `${allianceSide2.length}/3`;

    const s1Container = document.getElementById('side1SlotContainer');
    const s2Container = document.getElementById('side2SlotContainer');

    s1Container.innerHTML = allianceSide1.length === 0
        ? '<div class="text-slate-600 text-xs text-center py-6 italic">Ülke eklenmedi.</div>'
        : allianceSide1.map(c => `
            <div class="flex items-center justify-between p-2.5 bg-slate-900 border border-amber-500/30 rounded-xl text-xs">
                <div class="flex items-center space-x-2.5">
                    <img src="https://flagcdn.com/w40/${c.flagCode}.png" class="w-5 h-3.5 rounded object-cover shadow">
                    <span class="font-bold text-slate-200">${c.name}</span>
                    <span class="text-[10px] text-amber-400 font-mono">#${c.rank}</span>
                </div>
                <button onclick="removeFromAlliance(1, '${c.id}')" class="text-rose-400 hover:text-rose-300 p-1">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');

    s2Container.innerHTML = allianceSide2.length === 0
        ? '<div class="text-slate-600 text-xs text-center py-6 italic">Ülke eklenmedi.</div>'
        : allianceSide2.map(c => `
            <div class="flex items-center justify-between p-2.5 bg-slate-900 border border-sky-500/30 rounded-xl text-xs">
                <div class="flex items-center space-x-2.5">
                    <img src="https://flagcdn.com/w40/${c.flagCode}.png" class="w-5 h-3.5 rounded object-cover shadow">
                    <span class="font-bold text-slate-200">${c.name}</span>
                    <span class="text-[10px] text-sky-400 font-mono">#${c.rank}</span>
                </div>
                <button onclick="removeFromAlliance(2, '${c.id}')" class="text-rose-400 hover:text-rose-300 p-1">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');
}

function renderAllianceCountryPool(list) {
    const pool = document.getElementById('allianceCountryPool');
    pool.innerHTML = '';

    const inSide1 = id => allianceSide1.some(c => c.id === id);
    const inSide2 = id => allianceSide2.some(c => c.id === id);

    list.forEach(c => {
        const div = document.createElement('div');
        const s1Disabled = allianceSide1.length >= 3 || inSide1(c.id) || inSide2(c.id);
        const s2Disabled = allianceSide2.length >= 3 || inSide1(c.id) || inSide2(c.id);

        div.className = "flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs";
        div.innerHTML = `
            <div class="flex items-center space-x-2.5">
                <span class="font-bold font-mono text-amber-500 w-5">#${c.rank}</span>
                <img src="https://flagcdn.com/w40/${c.flagCode}.png" class="w-5 h-3.5 rounded object-cover shadow">
                <span class="font-medium text-slate-200">${c.name}</span>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="addToAlliance(1, '${c.id}')" ${s1Disabled ? 'disabled class="opacity-30 cursor-not-allowed px-2.5 py-1 bg-slate-800 rounded-lg text-[11px]"' : 'class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-[11px] transition"'}>
                    + 1. Blok
                </button>
<button onclick="addToAlliance(2, '${c.id}')" ${s2Disabled ? 'disabled class="opacity-30 cursor-not-allowed px-2.5 py-1 bg-slate-800 rounded-lg text-[11px]"' : 'class="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg font-bold text-[11px] transition"'}>
    + 2. Blok
</button>                    + 2. Blok
                </button>
            </div>
        `;
        pool.appendChild(div);
    });
}

function addToAlliance(side, countryId) {
    const country = allCountries.find(c => c.id === countryId);
    if (!country) return;

    if (side === 1 && allianceSide1.length < 3) {
        allianceSide1.push(country);
    } else if (side === 2 && allianceSide2.length < 3) {
        allianceSide2.push(country);
    }
    updateAllianceSlots();
    renderAllianceCountryPool(allCountries);
}

function removeFromAlliance(side, countryId) {
    if (side === 1) {
        allianceSide1 = allianceSide1.filter(c => c.id !== countryId);
    } else {
        allianceSide2 = allianceSide2.filter(c => c.id !== countryId);
    }
    updateAllianceSlots();
    renderAllianceCountryPool(allCountries);
}

document.getElementById('allianceSearchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allCountries.filter(c => c.name.toLowerCase().includes(term));
    renderAllianceCountryPool(filtered);
});

function startAllianceWar() {
    if (allianceSide1.length === 0 || allianceSide2.length === 0) {
        alert("Lütfen her iki tarafa da en az 1 ülke ekleyin!");
        return;
    }

    destroyRadarChart();
    closeAllianceModal();
    isCompareMode = true;
    isAllianceMode = true;
    isScenarioMode = false;
    document.getElementById('compareViewTitle').innerText = "3v3 Müttefikler Savaşı & Çoklu Blok Simülasyonu";
    document.getElementById('singleView').classList.add('hidden');
    document.getElementById('compareView').classList.remove('hidden');
    renderAllianceCompare();
}

function openScenarioModal() {
    const sel1 = document.getElementById('scenarioCountry1');
    const sel2 = document.getElementById('scenarioCountry2');
    if (!sel1 || !sel2 || allCountries.length === 0) return;

    const preferredFirstId = allCountries.some(c => c.id === activeId) ? activeId : allCountries[0].id;
    const preferredSecondId = activeId === 'greece' ? 'turkey' : 'greece';
    const fallbackSecond = allCountries.find(c => c.id !== preferredFirstId)?.id || preferredFirstId;
    const secondId = allCountries.some(c => c.id === preferredSecondId) && preferredSecondId !== preferredFirstId
        ? preferredSecondId
        : fallbackSecond;

    sel1.replaceChildren();
    sel2.replaceChildren();

    allCountries.forEach(c => {
        const label = `#${c.rank} ${c.name}`;
        sel1.add(new Option(label, c.id));
        sel2.add(new Option(label, c.id));
    });

    sel1.value = preferredFirstId;
    sel2.value = secondId;
    document.getElementById('scenarioModal').classList.remove('hidden');
    checkBorderStatus();
}

function closeScenarioModal() {
    document.getElementById('scenarioModal').classList.add('hidden');
}

function exitCompareMode() {
    destroyRadarChart();
    isCompareMode = false;
    isAllianceMode = false;
    isScenarioMode = false;
    compareId = null;
    allianceSide1 = [];
    allianceSide2 = [];

    const compareContent = document.getElementById('compareContent');
    if (compareContent) compareContent.replaceChildren();

    document.getElementById('compareView').classList.add('hidden');
    document.getElementById('singleView').classList.remove('hidden');
}

function aggregateAllianceScore(countries) {
    let landScore = 0, airScore = 0, navalScore = 0, airDefenseScore = 0, droneScore = 0, artilleryScore = 0, total = 0;
    countries.forEach(c => {
        const s = calculateForceScore(c);
        landScore += s.landScore;
        airScore += s.airScore;
        navalScore += s.navalScore;
        airDefenseScore += s.airDefenseScore;
        droneScore += s.droneScore;
        artilleryScore += s.artilleryScore;
        total += s.total;
    });
    return { landScore, airScore, navalScore, airDefenseScore, droneScore, artilleryScore, total };
}

function extractCumulativeMetrics(countries) {
    const res = { personnel: 0, tanks: 0, armored: 0, artillery: 0, rockets: 0, fighters: 0, attackHelis: 0, drones: 0, transports: 0, samLong: 0, samMid: 0, samPoint: 0, carriers: 0, subs: 0, frigates: 0, corvettes: 0 };
    (Array.isArray(countries) ? countries : []).forEach(c => {
        res.personnel += toFiniteNumber(c?.activePersonnel);
        res.tanks += sumMap(c?.landForces?.mainBattleTanks);
        res.armored += sumMap(c?.landForces?.armoredVehicles);
        res.artillery += sumMap(c?.landForces?.selfPropelledArtillery);
        res.rockets += sumMap(c?.landForces?.rocketArtillery);
        res.fighters += sumMap(c?.airForces?.fighterAircraft);
        res.attackHelis += sumMap(c?.airForces?.attackHelicopters);
        res.drones += sumMap(c?.airForces?.ucavAndDrones);
        res.transports += sumMap(c?.airForces?.transportAndTanker);

        const ad = getAirDefenseData(c);
        res.samLong += sumMap(ad.strategicLongRange);
        res.samMid += sumMap(ad.mediumShortRange);
        res.samPoint += sumMap(ad.pointDefenseAndGun);

        res.carriers += sumMap(c?.navalForces?.aircraftCarriers);
        res.subs += sumMap(c?.navalForces?.submarines);
        res.frigates += sumMap(c?.navalForces?.destroyersAndFrigates);
        res.corvettes += sumMap(c?.navalForces?.corvettesAndPatrol);
    });
    return res;
}

function executeAdvancedWargame() {
    try {
        const sel1 = document.getElementById('scenarioCountry1');
        const sel2 = document.getElementById('scenarioCountry2');
        if (!sel1 || !sel2) return;

        const id1 = sel1.value;
        const id2 = sel2.value;

        if (!id1 || !id2 || id1 === id2) {
            alert("Lütfen iki farklı ülke seçin!");
            return;
        }

        const c1 = allCountries.find(c => c.id === id1);
        const c2 = allCountries.find(c => c.id === id2);
        if (!c1 || !c2) {
            alert("Seçilen ülkelerin verisi bulunamadı.");
            return;
        }

        const scenarioRadio = document.querySelector('input[name="scenarioType"]:checked');
        const terrainRadio = document.querySelector('input[name="terrain"]:checked');
        const scenarioType = scenarioRadio ? scenarioRadio.value : 'naval';
        const terrain = terrainRadio ? terrainRadio.value : 'plains';

        destroyRadarChart();
        closeScenarioModal();
        isCompareMode = true;
        isScenarioMode = true;
        isAllianceMode = false;
        compareId = null;
        allianceSide1 = [];
        allianceSide2 = [];

        document.getElementById('compareViewTitle').innerText = `Taktik Harp Simülasyonu: ${c1.name} vs ${c2.name}`;
        document.getElementById('singleView').classList.add('hidden');
        document.getElementById('compareView').classList.remove('hidden');

        renderWargameSimulation(c1, c2, scenarioType, terrain);
    } catch (err) {
        console.error("Wargame hatası:", err);
        alert("Simülasyon oluşturulurken beklenmeyen bir hata oluştu.");
    }
}

function renderWargameSimulation(c1, c2, scenarioType, terrain) {
    const m1 = extractCumulativeMetrics([c1]);
    const m2 = extractCumulativeMetrics([c2]);
    const s1 = calculateForceScore(c1);
    const s2 = calculateForceScore(c2);

    let scenarioTitle = "";
    let terrainTitle = "";
    let terrainMod1 = 1.0, terrainMod2 = 1.0;

    if (terrain === 'mountain') { terrainTitle = "Dağlık & Geçitler"; terrainMod1 *= 0.85; terrainMod2 *= 0.95; }
    else if (terrain === 'urban') { terrainTitle = "Meskun Mahal / Şehir"; terrainMod1 *= 0.88; terrainMod2 *= 0.90; }
    else if (terrain === 'archipelago') { terrainTitle = "Takımada & Boğazlar"; terrainMod1 *= 1.05; }
    else { terrainTitle = "Açık Düzlük & Bozkır"; terrainMod1 *= 1.15; terrainMod2 *= 1.05; }

    let phase1 = {}, phase3 = {};
    let finalPower1 = 0, finalPower2 = 0;

    if (scenarioType === 'border') {
        scenarioTitle = "Konvansiyonel Sınır Taarruzu & Yarma Harekatı";

        const artDiff = (s1.artilleryScore * terrainMod1) - (s2.artilleryScore * terrainMod2);
        phase1 = {
            title: "1. Faz: Karşı-Batarya & Roket Doyurma Ateşi",
            log: artDiff > 0
                ? `<strong>${c1.name}</strong>, kundağı motorlu obüs ve ÇNRA menzil üstünlüğüyle <strong>${c2.name}</strong> sınır tahkimatlarını ağır bombardımana tuttu.`
                : `<strong>${c2.name}</strong>, güçlü topçu savunma hattıyla <strong>${c1.name}</strong> öncü unsurlarına yoğun doyurma ateşi açarak intikali yavaşlattı.`
        };

        const seadAdvantage = (s1.droneScore * 1.5) - (s2.airDefenseScore * 0.8);
        phase1.sead = seadAdvantage > 0
            ? `${c1.name} SİHA filoları, düşmanın ön cephe alçak irtifa hava savunma radarlarını baskılayarak hava koridoru açtı.`
            : `${c2.name} katmanlı SAM şemsiyesi, taarruz eden SİHA ve hafif hava unsurlarını önleme sahasında karşıladı.`;

        const tankLoss1 = Math.round(Math.min(m1.tanks, Math.max(5, m1.tanks * (0.12 + Math.random() * 0.08))));
        const tankLoss2 = Math.round(Math.min(m2.tanks, Math.max(5, m2.tanks * (0.16 + Math.random() * 0.12))));
        phase3 = {
            title: "2. Faz: Ana Muharebe Tankı & ZMA Yarma Hattı",
            log: `Zırhlı tugaylar temas hattına girdi. Tahmini Zırhlı Kayıpları: <strong>${c1.name} (~${tankLoss1} Tank/ZMA)</strong> vs <strong>${c2.name} (~${tankLoss2} Tank/ZMA)</strong>. Aktif Koruma Sistemleri (APS) kritik tanksavar füzelerini bertaraf etti.`
        };

        finalPower1 = (s1.landScore * 1.6 + s1.artilleryScore * 1.8 + s1.droneScore * 1.4) * terrainMod1;
        finalPower2 = (s2.landScore * 1.3 + s2.airDefenseScore * 1.6 + s2.artilleryScore * 1.4) * terrainMod2;

    } else if (scenarioType === 'sead') {
        scenarioTitle = "SEAD / SİHA & Hava Sahası Baskılama Operasyonu";

        const droneLoss1 = Math.round(Math.min(m1.drones, Math.max(2, m1.drones * 0.18)));
        const samLoss2 = Math.round(Math.min(m2.samLong + m2.samMid, Math.max(1, (m2.samLong + m2.samMid) * 0.25)));

        phase1 = {
            title: "1. Faz: Elektronik Harp & Radar Körleştirme",
            log: `<strong>${c1.name}</strong> elektronik harp istasyonları (KORAL vb.) ile düşman erken uyarı radarlarını yayından düşürdü. Sahte hedef ve kamikaze İHA sürüleri fırlatıldı.`
        };
        phase3 = {
            title: "2. Faz: Anti-Radyasyon & Hassas SAM Avı",
            log: `Hava savunma bataryaları mühimmat tüketim sınırına ulaştı. <strong>${c2.name}</strong> hava savunma kalkanında ~${samLoss2} kritik radar/SAM bataryası vuruldu. <strong>${c1.name}</strong> ~${droneLoss1} SİHA/Dron kaybetti.`
        };

        finalPower1 = (s1.droneScore * 2.6 + s1.airScore * 2.0) * terrainMod1;
        finalPower2 = (s2.airDefenseScore * 2.4 + s2.airScore * 1.1) * terrainMod2;

    } else if (scenarioType === 'naval') {
        scenarioTitle = "Deniz Hakimiyeti & Amfibi Çıkarma Harekatı";

        const navalAirSupport1 = (s1.droneScore * 0.8) + (s1.airScore * 0.6) + (m1.carriers * 45);
        const navalAirSupport2 = (s2.droneScore * 0.8) + (s2.airScore * 0.6) + (m2.carriers * 45);

        phase1 = {
            title: "1. Faz: Denizaltı Pususu, ASW Taraması & Ağ Merkezli Keşif",
            log: `Havadan Bağımsız Tahrikli (AIP) denizaltılar kritik boğazlarda temas kurdu. <strong>${c1.name}</strong> ve <strong>${c2.name}</strong> deniz karakol uçakları ve fırkateyn sonarlarıyla yoğun Denizaltı Savunma Harbi (ASW) icra etti.`
        };

        const airAdvMessage = navalAirSupport1 > navalAirSupport2
            ? `<strong>${c1.name}</strong>, SİHA/Donanma hava şemsiyesi ve erken ihbar desteğiyle düşman suüstü filosuna karşı menzil ve görüş üstünlüğü sağladı.`
            : `<strong>${c2.name}</strong>, katmanlı hava savunma korumasıyla donanmasını seyir ve gemisavar füzelerine karşı etkin biçimde perdeledi.`;

        phase3 = {
            title: "2. Faz: Gemisavar Seyir Füzesi Düellosu & Kıyı Baş Tutma",
            log: `Maksimum menzilden ATMACA, Harpoon ve Exocet füzeleri fırlatıldı. ${airAdvMessage} Amfibi görev grupları ve hava savunma koruması altındaki çıkarma gemileri kıyı başı tutma safhasına geçti.`
        };

        finalPower1 = (s1.navalScore * 1.8 + navalAirSupport1 * 1.2 + s1.airDefenseScore * 0.5) * terrainMod1;
        finalPower2 = (s2.navalScore * 1.8 + navalAirSupport2 * 1.2 + s2.airDefenseScore * 0.5) * terrainMod2;

    } else {
        scenarioTitle = "Topyekün Yıpratma & Balistik Füze Düellosu";

        phase1 = {
            title: "1. Faz: Kritik Altyapı & Komuta Kontrol Vuruşları",
            log: `Stratejik hava üsleri, askeri mühimmat fabrikaları ve radar kuleleri uzun menzilli seyir ve balistik füzelerle hedef alındı.`
        };
        phase3 = {
            title: "2. Faz: Savunma Sanayii Bağımsızlığı & Lojistik İkmal",
            log: `Yerli üretim kapasitesi yüksek olan taraf mühimmat stoklarını yenilerken, dışa bağımlı sistemler yedek parça yetersizliğiyle operasyonel hız kaybetti.`
        };

        finalPower1 = (s1.total * 1.3 + s1.artilleryScore * 1.6) * (1.35 - c1.rank * 0.006);
        finalPower2 = (s2.total * 1.3 + s2.artilleryScore * 1.6) * (1.35 - c2.rank * 0.006);
    }

    const totalCombat = finalPower1 + finalPower2 || 1;
    const winProb1 = Math.min(94, Math.max(6, Math.round((finalPower1 / totalCombat) * 100)));
    const winProb2 = 100 - winProb1;
    const winner = winProb1 >= winProb2 ? c1.name : c2.name;

    const attrition1 = Math.round(100 - (winProb1 * 0.75 + Math.random() * 8));
    const attrition2 = Math.round(100 - (winProb2 * 0.75 + Math.random() * 8));

    const wargameHeaderHtml = `
        <div class="relative overflow-hidden bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.25)] mb-6">
            <div class="absolute inset-0 scanline pointer-events-none"></div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800 relative z-10">
                <div>
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-xs font-black text-rose-400 font-mono uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-md border border-rose-500/30">
                            <i class="fa-solid fa-radiation mr-1"></i> HARP SENARYOSU SİMÜLASYONU
                        </span>
                        <span class="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                            <i class="fa-solid fa-map-location-dot mr-1"></i> ${terrainTitle}
                        </span>
                    </div>
                    <h3 class="text-2xl sm:text-3xl font-black text-slate-100 tracking-wide">${c1.name} <span class="text-rose-500">VS</span> ${c2.name}</h3>
                    <p class="text-xs text-slate-400 mt-1">${scenarioTitle}</p>
                </div>

                <div class="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/30 text-right min-w-[200px]">
                    <span class="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">Harp Motoru Kararı</span>
                    <span class="text-xl font-extrabold text-amber-400 uppercase tracking-wide flex items-center justify-end space-x-1.5 mt-0.5">
                        <i class="fa-solid fa-trophy text-amber-400 text-sm"></i>
                        <span>${winner}</span>
                    </span>
                    <span class="text-xs text-rose-400 font-mono font-bold">Zafer Olasılığı: %${Math.max(winProb1, winProb2)}</span>
                </div>
            </div>

            <div class="mt-6 space-y-4 relative z-10">
                <div>
                    <div class="flex justify-between items-center text-xs font-bold font-mono mb-2">
                        <span class="text-amber-400 flex items-center space-x-2">
                            <img src="https://flagcdn.com/w40/${c1.flagCode}.png" class="w-6 h-4 rounded object-cover shadow">
                            <span class="text-sm">${c1.name} (%${winProb1})</span>
                        </span>
                        <span class="text-sky-400 flex items-center space-x-2">
                            <span class="text-sm">${c2.name} (%${winProb2})</span>
                            <img src="https://flagcdn.com/w40/${c2.flagCode}.png" class="w-6 h-4 rounded object-cover shadow">
                        </span>
                    </div>
                    <div class="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-slate-800 flex shadow-inner">
                        <div style="width: ${winProb1}%" class="bg-gradient-to-r from-amber-600 to-amber-400 rounded-l-full transition-all duration-700"></div>
                        <div style="width: ${winProb2}%" class="bg-gradient-to-r from-sky-400 to-sky-600 rounded-r-full transition-all duration-700"></div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-2">
                    <div class="p-3 bg-slate-950/60 rounded-xl border border-amber-500/20 text-xs">
                        <span class="text-slate-400 block mb-1 font-medium">${c1.name} Tahmini Kuvvet Yıpranması</span>
                        <span class="text-sm font-bold font-mono text-rose-400">%${attrition1} Hasar / Kayıp Oranı</span>
                    </div>
                    <div class="p-3 bg-slate-950/60 rounded-xl border border-sky-500/20 text-xs text-right">
                        <span class="text-slate-400 block mb-1 font-medium">${c2.name} Tahmini Kuvvet Yıpranması</span>
                        <span class="text-sm font-bold font-mono text-rose-400">%${attrition2} Hasar / Kayıp Oranı</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 mb-6">
            <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
                <i class="fa-solid fa-terminal text-amber-500"></i>
                <span>Taktiksel Komuta ve Angajman Günlüğü</span>
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-300">
                <div class="p-4 bg-slate-900/90 rounded-xl border border-slate-800 leading-relaxed space-y-1.5">
                    <span class="font-bold text-amber-400 block text-xs uppercase">${phase1.title}</span>
                    <p>${phase1.log}</p>
                    ${phase1.sead ? `<p class="text-slate-400 italic pt-1 border-t border-slate-800">${phase1.sead}</p>` : ''}
                </div>
                <div class="p-4 bg-slate-900/90 rounded-xl border border-slate-800 leading-relaxed space-y-1.5">
                    <span class="font-bold text-sky-400 block text-xs uppercase">${phase3.title}</span>
                    <p>${phase3.log}</p>
                </div>
            </div>
        </div>
    `;

    renderUnifiedCompareUI({
        headerTitle1: c1.name,
        headerSub1: `Global Sıralama: #${c1.rank}`,
        flags1: [c1],
        headerTitle2: c2.name,
        headerSub2: `Global Sıralama: #${c2.rank}`,
        flags2: [c2],
        score1: s1,
        score2: s2,
        overallWinner: winner,
        reportText: `
            <p class="text-slate-200 mb-2">
                <strong>${scenarioTitle}</strong> doktrini ve <strong>${terrainTitle}</strong> muharebe coğrafyasında gerçekleştirilen operasyonda; çok katmanlı savunma kalkanı ve ateş gücü koordinasyonuyla üstünlük sağlayan taraf <span class="text-amber-400 font-bold uppercase underline">${winner}</span> olmuştur.
            </p>
            <p class="text-slate-400 text-xs border-t border-slate-800/80 pt-2 italic">
                > Harp Değerlendirmesi: Sayısal envanter hacmi kadar platformların modern nesil teknolojisi (AESA radar, Aktif Koruma, AIP Tahrik) muharebenin nihai sonucunda tayin edici rol oynamıştır.
            </p>
        `,
        rawMetrics1: m1,
        rawMetrics2: m2,
        customHeaderHtml: wargameHeaderHtml
    });
}

function renderSingleCompare() {
    const c1 = allCountries.find(c => c.id === activeId);
    const c2 = allCountries.find(c => c.id === compareId);
    if (!c1 || !c2) return;

    const score1 = calculateForceScore(c1);
    const score2 = calculateForceScore(c2);

    const higherRankCountry = c1.rank < c2.rank ? c1 : c2;
    const lowerRankCountry = c1.rank < c2.rank ? c2 : c1;
    const overallWinner = score1.total > score2.total ? c1.name : (score2.total > score1.total ? c2.name : "Eşit");

    renderUnifiedCompareUI({
        headerTitle1: c1.name,
        headerSub1: `Global Sıralama: #${c1.rank}`,
        flags1: [c1],
        headerTitle2: c2.name,
        headerSub2: `Global Sıralama: #${c2.rank}`,
        flags2: [c2],
        score1,
        score2,
        overallWinner,
        reportText: `
            <p class="text-slate-200 mb-2">
                <strong>${c1.name}</strong> ile <strong>${c2.name}</strong> karşılaştırmasında; harp tecrübesi, yerli mühimmat bağımsızlığı, ağ merkezli C4ISR kabiliyeti ve küresel güç projeksiyonu dikkate alındığında stratejik üstünlük <span class="text-amber-400 font-bold uppercase underline">${overallWinner}</span> tarafındadır.
            </p>
            <p class="text-slate-400 text-xs border-t border-slate-800/80 pt-2 italic">
                > Not: <strong>${lowerRankCountry.name}</strong> belirli konvansiyonel alt başlıklarda daha yüksek sayısal stoğa sahip olsa da; <strong>${higherRankCountry.name}</strong> teknolojik nesil üstünlüğü, SİHA doktrini ve sürdürülebilir lojistik derinliği sayesinde küresel askeri endekste (#${higherRankCountry.rank}) daha üstte konumlanmaktadır.
            </p>
        `,
        rawMetrics1: extractCumulativeMetrics([c1]),
        rawMetrics2: extractCumulativeMetrics([c2])
    });
}

function renderAllianceCompare() {
    const list1 = allianceSide1;
    const list2 = allianceSide2;

    const score1 = aggregateAllianceScore(list1);
    const score2 = aggregateAllianceScore(list2);

    const name1 = list1.map(c => c.name).join(" + ");
    const name2 = list2.map(c => c.name).join(" + ");
    const overallWinner = score1.total > score2.total ? "1. Blok (Müttefikler)" : (score2.total > score1.total ? "2. Blok (Karşı Güç)" : "Eşit");

    renderUnifiedCompareUI({
        headerTitle1: "1. Blok Müttefik Güçleri",
        headerSub1: `${list1.length} Ülke Birleşik Envanteri`,
        flags1: list1,
        headerTitle2: "2. Blok Karşı Kuvvetleri",
        headerSub2: `${list2.length} Ülke Birleşik Envanteri`,
        flags2: list2,
        score1,
        score2,
        overallWinner,
        reportText: `
            <p class="text-slate-200 mb-2">
                <strong>[${name1}]</strong> koalisyonu ile <strong>[${name2}]</strong> koalisyonu arasındaki topyekün ittifak savaş simülasyonunda; birleşik hava savunma şemsiyesi, çoklu filo doktrini ve kümülatif ateş gücü katsayılarıyla üstünlük sağlayan taraf <span class="text-amber-400 font-bold uppercase underline">${overallWinner}</span> olmuştur.
            </p>
            <p class="text-slate-400 text-xs border-t border-slate-800/80 pt-2 italic">
                > Çoklu İttifak Analizi: Müttefik hava unsurlarının ortak operasyon icra edebilme yeteneği, müşterek deniz görev grupları ve katmanlı SAM şemsiyeleri simülasyon puanına çarpan olarak dahil edilmiştir.
            </p>
        `,
        rawMetrics1: extractCumulativeMetrics(list1),
        rawMetrics2: extractCumulativeMetrics(list2)
    });
}

function renderUnifiedCompareUI(data) {
    const container = document.getElementById('compareContent');
    if (!container) return;

    destroyRadarChart();

    const score1 = data.score1 || {};
    const score2 = data.score2 || {};
    const landWinner = toFiniteNumber(score1.landScore) >= toFiniteNumber(score2.landScore) ? data.headerTitle1 : data.headerTitle2;
    const airWinner = toFiniteNumber(score1.airScore) >= toFiniteNumber(score2.airScore) ? data.headerTitle1 : data.headerTitle2;
    const navalWinner = toFiniteNumber(score1.navalScore) >= toFiniteNumber(score2.navalScore) ? data.headerTitle1 : data.headerTitle2;
    const adWinner = toFiniteNumber(score1.airDefenseScore) >= toFiniteNumber(score2.airDefenseScore) ? data.headerTitle1 : data.headerTitle2;

    let baseHtml = '';

    if (data.customHeaderHtml) {
        baseHtml += data.customHeaderHtml;
    } else {
        baseHtml += `
            <div class="grid grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div class="flex items-center space-x-3.5">
                    <div class="flex -space-x-2 overflow-hidden">
                        ${(data.flags1 || []).map(f => `<img src="https://flagcdn.com/w80/${f.flagCode}.png" class="inline-block w-11 h-7 rounded shadow border border-slate-700 object-cover">`).join('')}
                    </div>
                    <div>
                        <h3 class="text-lg sm:text-xl font-bold text-slate-100">${data.headerTitle1}</h3>
                        <span class="text-xs text-amber-400 font-mono">${data.headerSub1}</span>
                    </div>
                </div>
                <div class="flex items-center justify-end space-x-3.5 text-right">
                    <div>
                        <h3 class="text-lg sm:text-xl font-bold text-slate-100">${data.headerTitle2}</h3>
                        <span class="text-xs text-sky-400 font-mono">${data.headerSub2}</span>
                    </div>
                    <div class="flex -space-x-2 overflow-hidden">
                        ${(data.flags2 || []).map(f => `<img src="https://flagcdn.com/w80/${f.flagCode}.png" class="inline-block w-11 h-7 rounded shadow border border-slate-700 object-cover">`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    baseHtml += `
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
            <div class="xl:col-span-6 flex flex-col items-center justify-center p-2">
                <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center space-x-2">
                    <i class="fa-solid fa-chart-pie text-amber-500"></i>
                    <span>6 Eksenli Taktik Güç Dağılımı (Radar Chart)</span>
                </h4>
                <div class="w-full max-w-[380px] h-[340px] relative">
                    <canvas id="radarChart"></canvas>
                </div>
            </div>

            <div class="xl:col-span-6 space-y-3">
                <div class="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs sm:text-sm leading-relaxed shadow-lg">
                    ${data.reportText}
                </div>

                <div class="grid grid-cols-2 gap-2.5 text-xs">
                    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span class="text-slate-400 block mb-1"><i class="fa-solid fa-shield-halved text-amber-500 mr-1"></i> Kara Gücü</span>
                        <span class="font-bold text-amber-400 truncate block">${landWinner}</span>
                    </div>
                    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span class="text-slate-400 block mb-1"><i class="fa-solid fa-jet-fighter text-sky-400 mr-1"></i> Hava Gücü</span>
                        <span class="font-bold text-sky-400 truncate block">${airWinner}</span>
                    </div>
                    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span class="text-slate-400 block mb-1"><i class="fa-solid fa-ship text-teal-400 mr-1"></i> Deniz Gücü</span>
                        <span class="font-bold text-teal-400 truncate block">${navalWinner}</span>
                    </div>
                    <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span class="text-slate-400 block mb-1"><i class="fa-solid fa-satellite-dish text-emerald-400 mr-1"></i> Hava Savunma</span>
                        <span class="font-bold text-emerald-400 truncate block">${adWinner}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const m1 = data.rawMetrics1 || {};
    const m2 = data.rawMetrics2 || {};

    const metricsCategories = [
        {
            title: "Genel & Kara Kuvvetleri",
            icon: "fa-shield-halved",
            items: [
                { label: "Toplam Aktif Personel", v1: m1.personnel, v2: m2.personnel },
                { label: "Ana Muharebe Tankları (MBT)", v1: m1.tanks, v2: m2.tanks },
                { label: "Zırhlı Muharebe & Taşıyıcılar", v1: m1.armored, v2: m2.armored },
                { label: "Kundağı Motorlu Obüsler", v1: m1.artillery, v2: m2.artillery },
                { label: "Çok Namlulu Roketatar / ÇNRA", v1: m1.rockets, v2: m2.rockets }
            ]
        },
        {
            title: "Hava & SİHA Kuvvetleri",
            icon: "fa-jet-fighter",
            items: [
                { label: "Av / Muharebe Uçakları", v1: m1.fighters, v2: m2.fighters },
                { label: "Taarruz Helikopterleri", v1: m1.attackHelis, v2: m2.attackHelis },
                { label: "SİHA ve Keşif İHA Filosu", v1: m1.drones, v2: m2.drones },
                { label: "Nakliye & Tanker Uçakları", v1: m1.transports, v2: m2.transports }
            ]
        },
        {
            title: "Hava Savunma Şemsiyesi (SAM & C-RAM)",
            icon: "fa-satellite-dish",
            items: [
                { label: "Stratejik Uzun Menzil SAM", v1: m1.samLong, v2: m2.samLong },
                { label: "Orta & Alçak İrtifa Hava Savunma", v1: m1.samMid, v2: m2.samMid },
                { label: "Nokta Savunma & Uçaksavar Sistemleri", v1: m1.samPoint, v2: m2.samPoint }
            ]
        },
        {
            title: "Deniz Kuvvetleri",
            icon: "fa-ship",
            items: [
                { label: "Uçak Gemisi & Amfibi Hücum (LHD)", v1: m1.carriers, v2: m2.carriers },
                { label: "Denizaltılar", v1: m1.subs, v2: m2.subs },
                { label: "Muhrip & Fırkateynler", v1: m1.frigates, v2: m2.frigates },
                { label: "Korvet & Karakol Hücumbotları", v1: m1.corvettes, v2: m2.corvettes }
            ]
        }
    ];

    metricsCategories.forEach(cat => {
        baseHtml += `
            <div class="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5">
                <div class="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800/80">
                    <i class="fa-solid ${cat.icon} text-amber-500 text-sm"></i>
                    <h4 class="font-bold text-slate-200 text-sm uppercase tracking-wider">${cat.title}</h4>
                </div>
                <div class="space-y-4">
        `;

        cat.items.forEach(item => {
            const value1 = toFiniteNumber(item.v1);
            const value2 = toFiniteNumber(item.v2);
            const total = (value1 + value2) || 1;
            const p1 = Math.round((value1 / total) * 100);
            const p2 = 100 - p1;

            const isC1Winner = value1 > value2;
            const isC2Winner = value2 > value1;

            baseHtml += `
                <div>
                    <div class="flex justify-between items-center text-xs mb-1.5 font-medium">
                        <span class="font-mono text-sm ${isC1Winner ? 'text-amber-400 font-bold' : 'text-slate-300'}">${value1.toLocaleString()}</span>
                        <span class="text-slate-400 uppercase tracking-wider text-[11px]">${item.label}</span>
                        <span class="font-mono text-sm ${isC2Winner ? 'text-sky-400 font-bold' : 'text-slate-300'}">${value2.toLocaleString()}</span>
                    </div>
                    <div class="w-full bg-slate-900 h-2.5 rounded-full flex overflow-hidden p-0.5 border border-slate-800">
                        <div style="width: ${p1}%" class="bg-amber-500 rounded-l-full transition-all duration-500"></div>
                        <div style="width: ${p2}%" class="bg-sky-500 rounded-r-full transition-all duration-500"></div>
                    </div>
                </div>
            `;
        });

        baseHtml += `
                </div>
            </div>
        `;
    });

    container.innerHTML = baseHtml;

    radarChartDrawTimer = setTimeout(() => {
        radarChartDrawTimer = null;
        if (document.getElementById('compareContent') !== container) return;
        drawRadarChart(data.headerTitle1, data.headerTitle2, score1, score2);
    }, 50);
}

function drawRadarChart(label1, label2, s1, s2) {
    const ctx = document.getElementById('radarChart');
    if (!ctx || typeof Chart === 'undefined') return;

    const existingChart = typeof Chart.getChart === 'function' ? Chart.getChart(ctx) : null;
    if (existingChart) existingChart.destroy();

    if (radarChartInstance && radarChartInstance !== existingChart) {
        try {
            radarChartInstance.destroy();
        } catch (error) {
            console.warn('Önceki radar grafik kapatılamadı:', error);
        }
    }
    radarChartInstance = null;

    const normalize = (v1, v2) => {
        const value1 = toFiniteNumber(v1);
        const value2 = toFiniteNumber(v2);
        const max = Math.max(value1, value2, 1);
        return [Math.round((value1 / max) * 100), Math.round((value2 / max) * 100)];
    };

    const [land1, land2] = normalize(s1.landScore, s2.landScore);
    const [air1, air2] = normalize(s1.airScore, s2.airScore);
    const [naval1, naval2] = normalize(s1.navalScore, s2.navalScore);
    const [ad1, ad2] = normalize(s1.airDefenseScore, s2.airDefenseScore);
    const [drone1, drone2] = normalize(s1.droneScore, s2.droneScore);
    const [art1, art2] = normalize(s1.artilleryScore, s2.artilleryScore);

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Zırhlı/Kara', 'Hava Hakimiyeti', 'Deniz Gücü', 'Hava Savunma', 'SİHA/Keşif', 'Ateş Gücü/Topçu'],
            datasets: [
                {
                    label: label1,
                    data: [land1, air1, naval1, ad1, drone1, art1],
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#f59e0b'
                },
                {
                    label: label2,
                    data: [land2, air2, naval2, ad2, drone2, art2],
                    backgroundColor: 'rgba(56, 189, 248, 0.25)',
                    borderColor: '#38bdf8',
                    borderWidth: 2,
                    pointBackgroundColor: '#38bdf8',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#38bdf8'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: '#94a3b8',
                        font: { size: 10, weight: 'bold' }
                    },
                    ticks: { display: false, max: 100, min: 0 }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 11, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function getFilteredList() {
    const term = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    return allCountries.filter(c => c.name.toLowerCase().includes(term));
}

document.getElementById('searchInput').addEventListener('input', () => {
    renderList(getFilteredList());
});

init();
