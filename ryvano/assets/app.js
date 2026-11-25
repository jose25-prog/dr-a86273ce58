(function () {
"use strict";
var API = window.RV_CFG.api + "/api/s";
var DEL = window.RV_CFG.api + "/api/delete";
var VER = "2026-11-24.1";
var LANG = document.documentElement.dataset.lang;
var REG = window.LOCALES_REG.filter(function (r) { return r.code === LANG; })[0];
var APP = (window.APPLANG && window.APPLANG[LANG]) || {};
var PACK = window.PACKS && window.PACKS[LANG];
var FULL = !!window.I18N[LANG] || !!PACK;
/* sample-amount currency per language (display only; sample records are labelled as such) */
var FMT = { "id-ID": ["IDR", 16000], "da-DK": ["DKK", 7], "de-DE": ["EUR", .92], "fr-FR": ["EUR", .92], "it-IT": ["EUR", .92], "nl-NL": ["EUR", .92], "fi-FI": ["EUR", .92], "el-GR": ["EUR", .92], "hr-HR": ["EUR", .92], "bg-BG": ["EUR", .92], "hu-HU": ["HUF", 360], "nb-NO": ["NOK", 10.5], "pl-PL": ["PLN", 4], "ro-RO": ["RON", 4.6], "sv-SE": ["SEK", 10], "vi-VN": ["VND", 25000], "tr-TR": ["TRY", 34], "cs-CZ": ["CZK", 23], "ru-RU": ["RUB", 90], "uk-UA": ["UAH", 41], "hi-IN": ["INR", 84], "th-TH": ["THB", 35], "zh-CN": ["CNY", 7.2], "ja-JP": ["JPY", 150], "ar-SA": ["SAR", 3.75], "he-IL": ["ILS", 3.7], "sr-RS": ["RSD", 105], "sr-Latn-RS": ["RSD", 105], "ko-KR": ["KRW", 1350], "zh-TW": ["TWD", 32] };
function setPath(o, path, v) { var p = path.split("."), c = o; for (var i = 0; i < p.length - 1; i++) { c = c[p[i]]; if (c == null) return; } c[p[p.length - 1]] = v; }
function fromPack() {
  var t = JSON.parse(JSON.stringify(window.I18N.en)); Object.keys(PACK).forEach(function (k) { if (!/^(kit|look)\./.test(k)) setPath(t, k, PACK[k]); });
  var m = FMT[LANG] || ["USD", 1]; t._name = REG.endonym; t._fmt = REG.app; t._cur = m[0]; t._rate = m[1]; return t;
}
function nice(n) { var m = Math.pow(10, Math.max(0, Math.floor(Math.log(n) / Math.LN10) - 1)); return Math.round(n / m) * m; }
/* A language the review text is not translated into: RYVANO's own interface words (from the app's dictionaries) are used
   where this page shows them; everything else stays English and the page says so. Nothing is machine-translated here. */
function partial() {
  var t = JSON.parse(JSON.stringify(window.I18N.en)), a = APP, g = function (k, d) { return a[k] || d; };
  t._fmt = "en-US"; t._partial = true;
  ["today", "train", "food", "money", "circle"].forEach(function (k) { t.steps[k] = g("nav." + k, t.steps[k]); t[k].h = t.steps[k]; t.onb.areas[k] = t.steps[k]; });
  t.sup.rec = g("nav.recovery", t.sup.rec); t.sup.hea = g("nav.health", t.sup.hea); t.sup.cal = g("nav.calendar", t.sup.cal);
  t.next = g("action.next", t.next); t.back = g("action.back", t.back); t.retry = g("action.retry", t.retry); t.saved = g("state.success", t.saved);
  t.g.next = t.next; t.g.back = t.back; t.g.rate.close = g("action.close", t.g.rate.close);
  t.langLabel = g("settings.language", t.langLabel); t.privacyLink = g("landing.navPrivacy", t.privacyLink); t.themeLabel = g("settings.appearance", t.themeLabel);
  t.optional = g("onboarding.optional", t.optional); t.onb.cont = g("action.continue", t.onb.cont); t.priv.close = g("action.close", t.priv.close);
  t.hero.kicker = g("landing.heroKicker", t.hero.kicker); t.hero.t1 = g("landing.heroTitle", t.hero.t1); t.hero.t2 = g("landing.heroTitleAccent", t.hero.t2);
  t.hero.body = g("landing.heroBody", t.hero.body); t.hero.cta = g("landing.ctaDayPass", t.hero.cta); t.hero.cta1 = g("landing.ctaHow", t.hero.cta1);
  t.reviewBanner = t.reviewBanner + " Test text is not translated into " + REG.endonym + " yet: RYVANO's own words are, the questions are in English.";
  return t;
}
var T = window.I18N[LANG] ? window.I18N[LANG] : PACK ? fromPack() : partial();
if (PACK) { var kn0 = {}; Object.keys(PACK).forEach(function (k) { var m = /^kit\.([^.]+)\.(.+)$/.exec(k); if (m) (kn0[m[1]] = kn0[m[1]] || {})[m[2]] = PACK[k]; }); window.KITNAMES = window.KITNAMES || {}; window.KITNAMES[LANG] = kn0; }
function lookName(id, dflt) { return (PACK && PACK["look." + id]) || dflt; }
/* weekday names come from the browser's locale data in every language */
if (!T._partial) { try { var wl = REG.app === "en-US" ? "en" : REG.app, wn = new Intl.DateTimeFormat(wl, { weekday: "narrow" }), wf = new Intl.DateTimeFormat(wl, { weekday: "long" }), wd = []; for (var wi = 0; wi < 7; wi++) wd.push(wn.format(new Date(2026, 0, 5 + wi))); T.train.days = wd; var tue = wf.format(new Date(2026, 0, 6)); T.today.day = tue.charAt(0).toLocaleUpperCase(wl) + tue.slice(1); } catch (e) { } }
var G18 = T.g;
var QA = /[?&]qa=1\b/.test(location.search);
/* review access: this review is private until the founder opens it. The access code arrives in the link (?k=) and is remembered; without it the server records nothing. */
var RC = (function () { var m = /[?&]k=([A-Za-z0-9]{8,64})/.exec(location.search); try { if (m) { localStorage.setItem("rv.k", m[1]); if (localStorage.getItem("rv.k") === m[1]) { try { var u = new URL(location.href); u.searchParams.delete("k"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (e) { } } return m[1]; } return localStorage.getItem("rv.k") || ""; } catch (e) { return m ? m[1] : ""; } })();
var CLOSED = false;
var FLOW = ["landing", "about", "q_first", "onboarding", "today", "train", "food", "money", "circle", "avatars", "support", "concepts", "q_areas", "q_confusing", "q_remove", "q_missing", "q_apps", "q_barriers", "q_regular", "q_pay", "submit"];
var STEPS = FLOW;
var DEST = ["today", "train", "food", "money", "circle"];
var TASKS = ["t_today", "t_train", "t_food", "t_money", "t_circle", "t_avatar"];
var CONCEPTS = ["c_shared_budget", "c_allowance", "c_lessons", "c_trip_budget", "c_split", "c_trip_photos", "c_family"];
var RATED = { today: 1, train: 1, food: 1, money: 1, circle: 1, avatars: 1, support: 1 };
var EASEON = { today: 1, train: 1, food: 1, money: 1, circle: 1, avatars: 1 };
var AREA7 = ["today", "train", "food", "money", "circle", "avatars", "support"];
var QCFG = {
  q_areas: { k: "areas", multi: true, max: 3, opts: AREA7 },
  q_confusing: { k: "confusing", multi: true, opts: AREA7.concat(["nav", "lang"]), none: "nothingC" },
  q_remove: { k: "remove", multi: true, opts: AREA7, none: "nothingR" },
  q_missing: { k: "missing", multi: true, opts: ["m_remind", "m_auto", "m_share", "m_learn", "m_lang", "m_other"], none: "nothingM" },
  q_regular: { k: "regular", multi: false, opts: ["daily", "weekly", "some", "never", "unsure"] },
  q_first: { k: "first", multi: false, opts: ["f_clear", "f_unsure", "f_plain", "f_conf"] },
  q_apps: { k: "apps", multi: true, opts: ["a_budget", "a_split", "a_fit", "a_plan", "a_sheet", "a_bank"], none: "nothingA" },
  q_barriers: { k: "barriers", multi: true, opts: ["b_have", "b_priv", "b_cost", "b_complex", "b_missing", "b_lang"], none: "nothingB" },
  q_pay: { k: "pay", multi: false, opts: ["p_def", "p_maybe", "p_prob", "p_free"] }
};
var AGES = ["a18", "a25", "a35", "a45", "a55", "na"];
var INTS = ["today", "train", "food", "money", "circle", "avatars"];
var CTRY = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH CM CA CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function f(str, o) { return String(str).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? "" : o[k]; }); }
function money(n) { try { return new Intl.NumberFormat(T._fmt, { style: "currency", currency: T._cur, maximumFractionDigits: 0 }).format(n); } catch (e) { return String(Math.round(n)); } }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } return null; }
var RM = function () { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; };

/* ---------- identity + state (anonymous random id; the server record is the source of truth) ---------- */
function rid() { var a = new Uint8Array(18); (window.crypto || window.msCrypto).getRandomValues(a); return btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "").slice(0, 24); }
function blank() { return { sid: null, reached: [], fb: {}, tasks: {}, concepts: {}, final: { areas: [], confusing: [], remove: [], missing: [], regular: "", note: "", first: "", apps: [], barriers: [], pay: "", appsNote: "" }, profile: { nick: "", age: "", country: "", interests: [] }, asked: {}, photo: "none", complete: false, step: 0 }; }
var S = blank();
try { var d0 = JSON.parse(ls("rv.draft") || "null"); if (d0 && d0.sid && /^[A-Za-z0-9_-]{16,40}$/.test(d0.sid)) { S = Object.assign(S, d0); S.final = Object.assign(blank().final, S.final); S.profile = Object.assign(blank().profile, S.profile); } } catch (e) { }
if (!S.sid) S.sid = ls("rv.sid") || rid();
ls("rv.sid", S.sid);
var T0 = Date.now(), taskStart = {};
function vp() { var w = window.innerWidth; return w < 700 ? "phone" : w < 1100 ? "tablet" : "desktop"; }
function payload() { return { rc: RC, sid: S.sid, ver: VER, lang: LANG, vp: vp(), test: QA, complete: !!S.complete, reached: S.reached, fb: S.fb, tasks: S.tasks, concepts: S.concepts, final: S.final, profile: S.profile, photo: S.photo, ms: Date.now() - T0 }; }

/* ---------- saving with retry; the server is idempotent by session id and records a completed submission once ---------- */
var gstatus = $("#gstatus"), timer = null, inflight = false, dirty = false, retryN = 0, retryT = null, wasFailing = false;
function setStatus(kind) {
  var m = kind === "offline" ? T.offline : kind === "fail" ? T.notSaved : "";
  if (gstatus) { gstatus.textContent = m; gstatus.dataset.kind = kind; }
  var r = $("#retry"); if (r) r.hidden = !(kind === "fail" || kind === "offline");
  var sb = $("#savebar"); if (sb) sb.hidden = !m;
  if (kind === "saved" && wasFailing) { wasFailing = false; toast(G18.toastBack); }
  if (kind === "fail" || kind === "offline") wasFailing = true;
}
function saveLocal() { ls("rv.draft", JSON.stringify(S)); }
/* a visit is not participation: nothing is sent until the person has actually answered, rated, tried a task or given a detail */
function meaningful() {
  var P = S.profile, F = S.final;
  return !!(P.nick || P.age || P.country || P.interests.length || F.areas.length || F.confusing.length || F.remove.length || F.missing.length || F.regular || F.note || F.first || F.apps.length || F.barriers.length || F.pay || F.appsNote || S.photo !== "none" || Object.keys(S.tasks).length ||
    Object.keys(S.fb).some(function (k) { var x = S.fb[k]; return x && (x.useful || x.ease || x.note); }) || Object.keys(S.concepts).some(function (k) { var x = S.concepts[k]; return x && x.useful; }));
}
function save(immediate) { saveLocal(); if (S.complete || CLOSED || !meaningful()) return; dirty = true; clearTimeout(timer); timer = setTimeout(flush, immediate ? 0 : 900); }
function setClosed() { CLOSED = true; dirty = false; clearTimeout(timer); clearTimeout(retryT); document.body.classList.add("closed"); var b = $("#banner"); if (b) b.textContent = G18.closed; var sb = $("#savebar"); if (sb) sb.hidden = true; if ($("#subcard")) renderSubmit(); }
function post(p) { return fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) { if (j && j.error === "closed") setClosed(); throw new Error(j.error || r.status); } return j; }); }); }
if (!RC) { fetch(window.RV_CFG.api + "/api/health").then(function (r) { return r.json(); }).then(function (j) { if (j && j.open === false) setClosed(); }).catch(function () { }); }
function flush() {
  if (inflight || !dirty || S.complete) return;
  if (navigator.onLine === false) { setStatus("offline"); return; }
  inflight = true; dirty = false;
  return post(payload()).then(function () { inflight = false; retryN = 0; setStatus("saved"); if (dirty) flush(); return true; }).catch(function () {
    inflight = false; if (CLOSED) { dirty = false; return false; } dirty = true; setStatus("fail"); retryN++; clearTimeout(retryT); retryT = setTimeout(flush, Math.min(60000, 3000 * Math.pow(2, retryN - 1))); return false;
  });
}
window.addEventListener("online", function () { if (dirty) flush(); });
window.addEventListener("pagehide", function () { if (dirty && !S.complete && navigator.sendBeacon) { try { navigator.sendBeacon(API, new Blob([JSON.stringify(payload())], { type: "text/plain" })); } catch (e) { } } });
var toastT = null;
function toast(msg) { var el = $("#toast"); if (!el) return; el.textContent = msg; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("on"); setTimeout(function () { if (!el.classList.contains("on")) el.textContent = ""; }, 250); }, 2200); }

/* ---------- shared demo state (simulated; never sent anywhere) ---------- */
var D = { name: "", areas: ["today", "train", "food", "money", "circle"], goal: 3, circleMode: "me", prio: { p1: false, p2: false, p3: false }, workout: false, workouts: [], meals: [], expenses: [], open: null, tab: "plan", moved: false, person: "sam", perm: { sam: {}, mom: {}, dee: {} }, av: null, qcat: "groceries", ex: 1 };
try { var dd = JSON.parse(ls("rv.demo") || "null"); if (dd) { ["name", "areas", "goal", "circleMode", "obDone", "moved"].forEach(function (k) { if (dd[k] !== undefined) D[k] = dd[k]; }); } } catch (e) { }
function demoSave() { ls("rv.demo", JSON.stringify({ name: D.name, areas: D.areas, goal: D.goal, circleMode: D.circleMode, obDone: !!D.obDone, moved: !!D.moved })); }
var CATS = ["groceries", "transport", "fun", "bills"];
var ITEMS = { groceries: ["market", "bakery", "corner"], transport: ["bus", "ride", "fuel"], fun: ["cinema", "coffee", "book"], bills: ["electricity", "internet", "phone"] };
var ENV = { market: 48, bakery: 12, corner: 31, bus: 40, ride: 14, fuel: 17, cinema: 22, coffee: 6, book: 18, electricity: 64, internet: 38, phone: 22 };
var ENCAP = { groceries: 150, transport: 80, fun: 70, bills: 160 };
function val(k) { var v = T.money.v; return v && v[k] != null ? v[k] : nice(ENV[k] * (T._rate || 1)); }
function cap(c) { var v = T.money.caps; return v && v[c] != null ? v[c] : nice(ENCAP[c] * (T._rate || 1)); }
function catSpent(c) { return ITEMS[c].reduce(function (s, k) { return s + val(k); }, 0) + D.expenses.filter(function (e) { return e.c === c; }).reduce(function (s, e) { return s + e.a; }, 0); }
function qdef() { return T.money.def || nice(12 * (T._rate || 1)); }
var MEALS = [["m1", "i1", 25], ["m2", "i2", 35], ["m3", "i3", 10], ["m4", "i4", 15]];

function task(id, text) {
  return '<div class="taskbox" data-task="' + id + '"><div><b>' + esc(T.task) + ':</b> ' + esc(text) + '</div><div class="row"><button class="btn" data-act="tstuck" data-t="' + id + '">' + esc(T.taskStuck) + '</button><button class="btn ghost" data-act="tskip" data-t="' + id + '">' + esc(T.taskSkip) + '</button></div><div class="status" role="status" data-tstat></div></div>';
}
function refreshTask(id) {
  var el = $('[data-task="' + id + '"]'); if (!el) return; var t = S.tasks[id], st = $("[data-tstat]", el);
  el.classList.toggle("done", !!t && t.done === "done");
  st.textContent = !t ? "" : t.done === "done" ? T.taskDone : t.done === "stuck" ? T.taskStuckDone : T.taskSkipped;
}
function completeTask(id) { if (S.tasks[id] && S.tasks[id].done === "done") return; S.tasks[id] = { done: "done", ms: Date.now() - (taskStart[id] || T0) }; refreshTask(id); save(); }
var SV = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
var ICON = {
 landing: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
 about: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.800 3.700-5.500 7-5.500s6.200 1.700 7 5.500"/></svg>',
 onboarding: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 today: '<svg viewBox="0 0 24 24" ' + SV + '><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
 train: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/></svg>',
 food: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M12 20c-4 0-7-3-7-7 0-3 2-5 4-5 1.500 0 2 .6 3 .6s1.500-.6 3-.6c2 0 4 2 4 5 0 4-3 7-7 7z"/><path d="M12 8c0-2 1-3 3-4"/></svg>',
 money: '<svg viewBox="0 0 24 24" ' + SV + '><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/></svg>',
 circle: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.500"/><path d="M3.500 19c.6-3 3-4.500 5.500-4.500s4.900 1.500 5.500 4.500M15 15c2.500-.3 4.700.9 5.500 4"/></svg>',
 avatars: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="9" r="4"/><path d="M4.500 20c.8-4 4-6 7.500-6s6.700 2 7.500 6"/></svg>',
 support: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"/></svg>',
 concepts: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>',
 final: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.800A8 8 0 1 1 21 12z"/></svg>',
 nav: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 0 2-6z"/></svg>',
 lang: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.600 2.700 3.900 5.700 3.900 9s-1.300 6.300-3.900 9c-2.600-2.700-3.900-5.700-3.900-9S9.400 5.700 12 3z"/></svg>',
 plus: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M12 5v14M5 12h14"/></svg>',
 c_groceries: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M4 9h16l-1.500 9.500a2 2 0 0 1-2 1.500h-9a2 2 0 0 1-2-1.500L4 9z"/><path d="M8 9l3-5M16 9l-3-5"/></svg>',
 c_transport: '<svg viewBox="0 0 24 24" ' + SV + '><rect x="5" y="4" width="14" height="13" rx="3"/><path d="M5 12h14M8 20v-3M16 20v-3"/><circle cx="9" cy="14.500" r=".6"/><circle cx="15" cy="14.500" r=".6"/></svg>',
 c_fun: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/><path d="M14 6v12" stroke-dasharray="2 2.500"/></svg>',
 c_bills: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/></svg>',
 dumbbell: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/></svg>',
 up: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M7 11v9H4v-9h3zM7 11l4-7c1.500 0 2.500 1 2.200 2.500L12.500 9H19a2 2 0 0 1 2 2.300l-1.200 6.500A2 2 0 0 1 17.800 20H7"/></svg>',
 down: '<svg viewBox="0 0 24 24" ' + SV + '><path d="M7 13V4H4v9h3zM7 13l4 7c1.500 0 2.500-1 2.200-2.500L12.500 15H19a2 2 0 0 0 2-2.300l-1.200-6.500A2 2 0 0 0 17.800 4H7"/></svg>',
 q: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 1-1 1.700M12 17h.01"/></svg>',
 smile: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.500 2.300 2 4 2s3-.5 4-2M9 9.500h.01M15 9.500h.01"/></svg>',
 meh: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M8.500 15h7M9 9.500h.01M15 9.500h.01"/></svg>',
 frown: '<svg viewBox="0 0 24 24" ' + SV + '><circle cx="12" cy="12" r="9"/><path d="M8 16c1-1.500 2.300-2 4-2s3 .5 4 2M9 9.500h.01M15 9.500h.01"/></svg>',
 chev: '<svg class="chev" viewBox="0 0 24 24" ' + SV + '><path d="M6 9l6 6 6-6"/></svg>',
 ck: '<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>',
 x: '<svg viewBox="0 0 24 24" width="20" height="20" ' + SV + '><path d="M6 6l12 12M18 6L6 18"/></svg>',
 sun: '<svg viewBox="0 0 24 24" width="20" height="20" ' + SV + '><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/></svg>',
 moon: '<svg viewBox="0 0 24 24" width="20" height="20" ' + SV + '><path d="M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z"/></svg>',
 check: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>'
};
Object.keys(ICON).forEach(function (k) { ICON[k] = ICON[k].replace("<svg ", "<svg aria-hidden=\"true\" focusable=\"false\" "); });
function stepLabel(id) { return T.steps[id] || T.steps.final; }
var KIND = { onboarding: "demo", today: "demo", train: "demo", food: "demo", money: "demo", circle: "demo", avatars: "demo", support: "sum", concepts: "concept" };
function kindChips(id) { var k = KIND[id]; if (!k) return ""; var h = '<span class="badge' + (k === "concept" ? " concept" : "") + '">' + esc(G18.kind[k]) + '</span>'; if (id === "money") h += '<span class="badge concept">' + esc(G18.kind.ext) + '</span>'; return '<p class="kinds">' + h + '</p>'; }
function head(id, extra) { var i = FLOW.indexOf(id); return '<p class="kicker"><span class="tile">' + (ICON[id] || ICON.final) + '</span>' + esc(stepLabel(id)) + '<span class="stepn" aria-label="' + esc(f(T.stepOf, { n: i + 1, t: FLOW.length })) + '">' + esc(f(G18.stepn, { n: i + 1, t: FLOW.length })) + '</span></p>' + kindChips(id) + (extra || ""); }
function kn(c, o) { var m = window.KITNAMES && window.KITNAMES[LANG]; return (m && m[c] && m[c][o.id]) || o.name; }
function note() { return '<p class="samplenote">' + esc(T.sample) + '</p>'; }
function hd(h, lead) { return '<h1 class="h2s" tabindex="-1">' + esc(h) + '</h1>' + (lead ? '<p class="lead">' + esc(lead) + '</p>' : ""); }

/* ---------- screens ---------- */
var AREAS5 = DEST;
function secLanding() {
  var H = T.hero;
  return '<div class="hero"><div class="wrap"><div class="grid"><div><div id="partialnote"></div><div id="resume"></div><p class="kick rv">' + esc(H.kicker) + '</p><h1 class="rv d1">' + esc(H.t1) + '<br><em>' + esc(H.t2) + '</em></h1><p class="lead big rv d2">' + esc(H.body) + '</p>' +
    '<p class="samplenote rv d2" style="margin:14px 0 0;max-width:52ch">' + esc(G18.demoNote) + '</p><div class="actions rv d3"><button class="btn primary" type="button" data-act="start" id="startbtn">' + esc(H.cta) + '</button><a class="btn" href="#link">' + esc(H.cta1) + '</a></div>' +
    '<ul class="how rv d3" aria-label="' + esc(T.how.h) + '">' + ["l1", "l2", "l3", "l4"].map(function (k) { return '<li>' + esc(T.how[k]) + '</li>'; }).join("") + '</ul></div>' +
    '<div class="phone"><div class="frame"><div class="scr" id="scr">' + AREAS5.map(function (a, i) { return '<img class="l' + (i ? "" : " on") + '" data-a="' + a + '" src="../assets/app-screens/' + a + '-' + LANG + '-light.webp" alt="' + esc(T.steps[a]) + '" width="560" height="1177"' + (i ? ' loading="lazy"' : "") + '><img class="dk' + (i ? "" : " on") + '" data-a="' + a + '" src="../assets/app-screens/' + a + '-' + LANG + '-dark.webp" alt="" width="560" height="1177" loading="lazy">'; }).join("") + '</div></div>' +
    '<div class="areas" role="group" aria-label="' + esc(H.real) + '">' + AREAS5.map(function (a, i) { return '<button data-d="' + a + '" data-act="shot" data-a="' + a + '" aria-pressed="' + (i === 0) + '"><i></i>' + esc(T.steps[a]) + '</button>'; }).join("") + '</div><p class="samplenote" style="text-align:center;max-width:34ch">' + esc(H.realNote) + '</p></div></div></div></div>' +
    '<div class="wrap linkwrap" id="link" style="padding-bottom:96px"><p class="kicker rv"><span class="tile">' + ICON.landing + '</span>' + esc(H.demoTitle) + '</p><h2 class="rv d1">' + esc(H.linkH) + '</h2><p class="lead rv d2">' + esc(H.demoHint) + '</p><div class="link rv d2" id="web"></div><div class="linkbar"><button class="btn primary" id="webbtn" data-act="webmove"></button><span class="status" id="webstat" role="status"></span></div></div>';
}
function renderPartial() {
  var el = $("#partialnote"); if (!el) return;
  if (!T._partial) { el.innerHTML = ""; return; }
  el.innerHTML = '<div class="resume" role="note"><h3>' + esc(G18.partial.h) + '</h3><p>' + esc(f(G18.partial.b, { lang: REG.endonym })) + '</p><div class="row">' + [["en", "English"], ["es-CO", "Espa\u00f1ol (Colombia)"], ["pt-BR", "Portugu\u00eas (Brasil)"]].map(function (x) { return '<a class="btn" href="../' + x[0] + '/" lang="' + (x[0] === "en" ? "en" : x[0]) + '">' + x[1] + '</a>'; }).join("") + '</div></div>';
}
function renderResume() {
  var el = $("#resume"); if (!el) return;
  if (S.complete) { el.innerHTML = '<div class="resume" role="status"><p>' + esc(G18.sentBefore) + '</p></div>'; return; }
  if (S.step >= 1) { el.innerHTML = '<div class="resume"><h3>' + esc(G18.resumeH) + '</h3><p>' + esc(f(G18.resumeB, { n: S.step + 1, t: FLOW.length })) + '</p><div class="row"><button class="btn primary" data-act="resume" type="button">' + esc(G18.resumeBtn) + '</button><button class="btn ghost" data-act="restart" type="button">' + esc(G18.resumeNew) + '</button></div></div>'; return; }
  el.innerHTML = "";
}
function renderWeb() {
  var H = T.hero, m = D.moved;
  $("#web").className = "link rv in" + (m ? " moved" : "");
  $("#web").innerHTML = AREAS5.map(function (k) { return '<div class="node" data-d="' + k + '"><span class="tile">' + ICON[k] + '</span><b>' + esc(T.steps[k]) + '</b><span>' + esc(H[k + (m ? "B" : "A")]) + '</span></div>'; }).join("");
  $("#webbtn").textContent = m ? H.back : H.move; $("#webstat").textContent = m ? H.moved : "";
}
/* participant details: all optional */
var rnames = null;
function regionName(c) { try { rnames = rnames || new Intl.DisplayNames([REG.app === "en-US" ? "en" : REG.app], { type: "region" }); return rnames.of(c) || c; } catch (e) { return c; } }
function secAbout() {
  var a = G18.about;
  return head("about", hd(a.h, a.lead)) + '<div class="form" style="margin-top:26px">' +
    '<div class="field"><label for="p-nick">' + esc(a.nick) + ' <span class="badge">' + esc(T.optional) + '</span></label><input id="p-nick" type="text" maxlength="24" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="' + esc(a.nickPh) + '"></div>' +
    '<div class="field"><span class="lb" id="p-age-l">' + esc(a.age) + ' <span class="badge">' + esc(T.optional) + '</span></span><div class="chips" role="radiogroup" aria-labelledby="p-age-l" id="p-age"></div></div>' +
    '<div class="field"><span class="lb" id="p-c-l">' + esc(a.country) + ' <span class="badge">' + esc(T.optional) + '</span></span><div id="p-country"></div></div>' +
    '<div class="field"><span class="lb">' + esc(a.lang) + '</span><div class="langrow"><b>' + esc(REG.endonym) + '</b><button class="btn" type="button" data-act="chglang">' + esc(a.langChange) + '</button></div></div>' +
    '<div class="field"><span class="lb" id="p-i-l">' + esc(a.ints) + ' <span class="badge">' + esc(a.intsHint) + '</span></span><div class="chips" role="group" aria-labelledby="p-i-l" id="p-ints"></div></div>' +
    '<p class="samplenote" style="margin:0">' + esc(a.note) + ' <button class="btn ghost" type="button" data-act="priv" style="min-height:44px;padding:4px 10px;font-size:13px">' + esc(T.privacyLink) + '</button></p></div>';
}
function renderAbout() {
  var P = S.profile;
  $("#p-nick").value = P.nick || "";
  $("#p-age").innerHTML = AGES.map(function (v) { return '<button class="chip" type="button" role="radio" aria-checked="' + (P.age === v) + '" data-fid="age-' + v + '" data-act="age" data-v="' + v + '">' + esc(G18.about.ages[v]) + '</button>'; }).join("");
  $("#p-country").innerHTML = '<button class="pickbtn" type="button" data-fid="ctry" data-act="pickctry" aria-haspopup="dialog" aria-labelledby="p-c-l p-c-v"><span class="pl' + (P.country ? "" : " ph") + '" id="p-c-v">' + esc(P.country ? regionName(P.country) : G18.about.countryPh) + '</span>' + ICON.chev + '</button>';
  $("#p-ints").innerHTML = INTS.map(function (v) { return '<button class="chip" type="button" data-fid="int-' + v + '" data-act="int" data-v="' + v + '" aria-pressed="' + (P.interests.indexOf(v) >= 0) + '">' + esc(T.steps[v]) + '</button>'; }).join("");
}
function secOnb() {
  return head("onboarding", hd(T.onb.h, T.onb.sub)) + '<div class="cols"><div class="stage onb" id="onb"></div><div class="side"><div class="mini" id="onbres" aria-live="polite"></div></div></div>';
}
var ob = { n: 0 };
function renderOnb() {
  var o = T.onb, n = ob.n, h = "";
  var bar = '<div class="bar3" role="progressbar" aria-label="' + esc(o.h) + '" aria-valuemin="1" aria-valuemax="3" aria-valuenow="' + (n + 1) + '"><i style="width:' + ((n + 1) / 3 * 100) + '%"></i></div>';
  if (n === 0) h = '<div class="onbstep"><h3>' + esc(o.s1) + '</h3><p class="samplenote" style="margin:0">' + esc(o.s1h) + '</p><div class="chips" role="group" aria-label="' + esc(o.s1) + '">' + AREAS5.map(function (a) { return '<button class="chip" type="button" data-act="oba" data-a="' + a + '" aria-pressed="' + (D.areas.indexOf(a) >= 0) + '">' + esc(o.areas[a]) + '</button>'; }).join("") + '</div></div>';
  if (n === 1) h = '<div class="onbstep"><div class="field"><label for="obname"><b>' + esc(o.s2) + '</b> <span style="font-weight:500">(' + esc(T.optional) + ')</span></label><input id="obname" type="text" maxlength="24" autocomplete="off" placeholder="' + esc(o.s2ph) + '" value="' + esc(D.name) + '"><span class="samplenote" style="margin:0">' + esc(o.s2h) + '</span></div><div class="field"><label for="obgoal"><b>' + esc(o.s3) + ': <output id="obgv" class="num">' + D.goal + '</output></b></label><input id="obgoal" type="range" min="0" max="6" value="' + D.goal + '" style="min-height:44px"><span class="samplenote" style="margin:0">' + esc(o.s3h) + '</span></div></div>';
  if (n === 2) h = '<div class="onbstep"><h3>' + esc(o.s4) + '</h3><div class="chips" role="radiogroup" aria-label="' + esc(o.s4) + '"><button class="chip" role="radio" aria-checked="' + (D.circleMode === "me") + '" data-act="obc" data-m="me">' + esc(o.s4a) + '</button><button class="chip" role="radio" aria-checked="' + (D.circleMode === "some") + '" data-act="obc" data-m="some">' + esc(o.s4b) + '</button></div><p class="samplenote" style="margin:0">' + esc(o.s4h) + '</p></div>';
  h += '<div class="row" style="justify-content:space-between"><span class="row">' + (n > 0 ? '<button class="btn ghost" data-act="obb">' + esc(T.back) + '</button>' : "") + '</span><span class="row">' + (n === 1 ? '<button class="btn ghost" data-act="obn" data-skip="1">' + esc(o.skip) + '</button>' : "") + '<button class="btn primary" data-act="obn">' + esc(n === 2 ? o.done : o.cont) + '</button></span></div>';
  $("#onb").innerHTML = bar + h;
  var items = D.areas.length ? D.areas.map(function (a) { return '<li class="item" data-d="' + a + '"><span class="tile" style="width:28px;height:28px;flex-basis:28px">' + ICON[a] + '</span><span class="n" style="flex:1">' + esc(T.hero[a + "A"]) + '</span></li>'; }).join("") : '<li class="samplenote">' + esc(o.s1h) + '</li>';
  $("#onbres").innerHTML = '<h3>' + esc(D.name ? f(T.today.hi, { name: D.name }) : T.today.hiAnon) + '</h3><ul class="list">' + items + '</ul><span class="pill">' + esc(f(T.train.goal, { n: D.goal })) + '</span>' + (D.obDone ? '<p class="ok-note" role="status">' + esc(o.resBody) + '</p>' : "");
}
function demoScreen(id, ui, body) { return head(id, hd(T[id].h, T[id].lead)) + task("t_" + id, T[id].task) + '<div class="stagewrap"><div class="stage" id="' + ui + '"></div>' + note() + '</div>'; }
function secToday() { return demoScreen("today", "todayui"); }
function plan() {
  var it = [[D.moved ? "19:00" : "07:00", T.today.w, D.workout, "train"], ["12:30", T.today.l, false, "food"]];
  D.meals.forEach(function (m) { it.push(["19:00", T.food[m], false, "food"]); });
  it.push(["18:00", T.today.e, D.prio.p3, "money"], ["19:30", T.today.d, false, "circle"]);
  it.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  return it;
}
function todaySpent() { return val("coffee") + D.expenses.reduce(function (s, e) { return s + e.a; }, 0); }
function renderToday() {
  var t = T.today, tab = D.tab, h;
  var pd = ["p1", "p2", "p3"].filter(function (k) { return D.prio[k]; }).length;
  h = '<div class="app"><div class="apphead"><h3>' + esc(D.name ? f(t.hi, { name: D.name }) : t.hiAnon) + '</h3><span class="badge">' + esc(t.day) + '</span></div>';
  if (D.areas.length) h += '<div class="chips">' + D.areas.map(function (a) { return '<span class="pill">' + esc(T.onb.areas[a]) + '</span>'; }).join("") + '</div>';
  h += '<div class="tabs" role="tablist">' + ["plan", "prio", "recap"].map(function (k) { return '<button role="tab" data-fid="tt-' + k + '" data-act="ttab" data-k="' + k + '" aria-selected="' + (tab === k) + '">' + esc(t.tabs[k]) + '</button>'; }).join("") + '</div>';
  if (tab === "plan") h += '<ul class="list">' + plan().map(function (p) { return '<li class="item' + (p[2] ? " done" : "") + '"><span class="t">' + p[0] + '</span><span class="n" style="flex:1">' + esc(p[1]) + '</span><span class="pill">' + esc(T.steps[p[3]]) + '</span></li>'; }).join("") + '</ul>';
  if (tab === "prio") h += '<h3>' + esc(t.prio) + '</h3><ul class="list">' + ["p1", "p2", "p3"].map(function (k) { return '<li class="item' + (D.prio[k] ? " done" : "") + '"><button class="chk" data-fid="chk-' + k + '" role="checkbox" aria-checked="' + D.prio[k] + '" aria-label="' + esc(t[k]) + '" data-act="prio" data-k="' + k + '">' + (D.prio[k] ? "\u2713" : "") + '</button><span class="n">' + esc(t[k]) + '</span></li>'; }).join("") + '</ul><p class="status" role="status">' + esc(f(t.done, { a: pd, b: 3 })) + '</p>';
  if (tab === "recap") h += '<div class="kpi"><div><span>' + esc(t.spent) + '</span><b>' + money(todaySpent()) + '</b></div><div><span>' + esc(t.meals) + '</span><b>' + (2 + D.meals.length) + '</b></div><div><span>' + esc(D.workout ? t.workoutLogged : t.workoutNo) + '</span><b>' + (D.workout ? "\u2713" : "\u2013") + '</b></div></div><p class="status">' + esc(f(t.done, { a: pd, b: 3 })) + '</p>';
  $("#todayui").innerHTML = h + '</div>';
}
function secTrain() { return demoScreen("train", "trainui"); }
function renderTrain() {
  var t = T.train, days = t.days, done = 2 + (D.workout ? 1 : 0);
  var h = '<div class="app"><div class="apphead"><h3>' + esc(t.week) + '</h3><span class="badge">' + esc(f(t.goal, { n: D.goal })) + ' \u00b7 ' + done + '/' + D.goal + '</span></div><div class="week">' + days.map(function (d, i) { var o = i === 0 || i === 2 || (i === 1 && D.workout); return '<span>' + d + '<i class="' + (o ? "on" : "") + '"></i></span>'; }).join("") + '</div>';
  h += '<div class="sheet" data-d="train"><h3>' + esc(t.log) + '</h3><div class="field"><span class="lb" id="tex-l" style="font-size:13px;font-weight:600;color:var(--text-2)">' + esc(t.ex) + '</span><button class="pickbtn" type="button" id="tex" data-fid="texb" data-act="pickex" aria-haspopup="dialog" aria-labelledby="tex-l tex-v"><span class="tile">' + ICON.dumbbell + '</span><span class="pl" id="tex-v">' + esc(t["ex" + D.ex]) + '</span>' + ICON.chev + '</button></div><div class="fields"><div class="field"><label for="tse">' + esc(t.sets) + '</label><input id="tse" type="number" inputmode="numeric" min="1" max="10" value="3"></div><div class="field"><label for="tre">' + esc(t.reps) + '</label><input id="tre" type="number" inputmode="numeric" min="1" max="30" value="8"></div><div class="field"><label for="tkg">' + esc(t.kg) + '</label><input id="tkg" type="number" inputmode="numeric" min="0" max="300" value="40"></div></div><button class="btn primary" data-fid="tsave" data-act="tsave">' + esc(t.save) + '</button><p class="ok-note" role="status">' + (D.lastSaved ? esc(t.savedMsg) : "") + '</p></div>';
  h += '<h3>' + esc(t.history) + '</h3>' + (D.workouts.length ? '<ul class="list">' + D.workouts.map(function (w) { return '<li class="item"><span class="n" style="flex:1">' + esc(w) + '</span></li>'; }).join("") + '</ul>' : '<p class="samplenote">' + esc(t.none) + '</p>');
  $("#trainui").innerHTML = h + '</div>';
}
function secFood() { return demoScreen("food", "foodui"); }
function renderFood() {
  var t = T.food, h = '<div class="app"><h3>' + esc(t.plan) + '</h3><ul class="list">' + MEALS.map(function (m) { var a = D.meals.indexOf(m[0]) >= 0; return '<li class="item"><span class="n" style="flex:1">' + esc(t[m[0]]) + '<br><small style="color:var(--text-2)">' + m[2] + ' ' + esc(t.time) + '</small></span><button class="btn' + (a ? "" : " primary") + '" data-fid="meal-' + m[0] + '" data-act="meal" data-m="' + m[0] + '" aria-pressed="' + a + '">' + esc(a ? t.added : t.add) + '</button></li>'; }).join("") + '</ul><h3>' + esc(t.groceries) + '</h3>';
  h += D.meals.length ? '<ul class="list">' + D.meals.map(function (k) { var m = MEALS.filter(function (x) { return x[0] === k; })[0]; return '<li class="item"><span class="n">' + esc(t[m[1]]) + '</span></li>'; }).join("") + '</ul>' : '<p class="samplenote">' + esc(t.empty) + '</p>';
  $("#foodui").innerHTML = h + '</div>';
}
function secMoney() { return demoScreen("money", "moneyui"); }
function renderMoney() {
  var t = T.money, h = '<div class="app"><div class="apphead"><h3>' + esc(t.month) + '</h3></div><p class="samplenote" style="margin:0">' + esc(t.tapHint) + '</p><div class="bars">';
  CATS.forEach(function (c) {
    var sp = catSpent(c), cp = cap(c), open = D.open === c;
    h += '<div data-d="money"><button class="bar" data-fid="cat-' + c + '" data-act="cat" data-c="' + c + '" aria-expanded="' + open + '" aria-controls="ent-' + c + '"><span class="top2"><span class="cn"><span class="tile" aria-hidden="true">' + ICON["c_" + c] + '</span><span class="nm">' + esc(t.cats[c]) + '</span></span><span class="lf"><b>' + money(Math.max(0, cp - sp)) + '</b><small>' + esc(t.left) + '</small></span></span><span class="track" aria-hidden="true"><i style="width:' + Math.min(100, sp / cp * 100) + '%"></i></span><span class="sub"><span>' + money(sp) + '</span><span>' + esc(t.of) + ' ' + money(cp) + '</span></span></button>';
    if (open) h += '<ul class="list" id="ent-' + c + '" aria-label="' + esc(t.entriesOf + ": " + t.cats[c]) + '">' + ITEMS[c].map(function (k) { return '<li class="entry"><span class="n">' + esc(t.items[k]) + '</span><b>' + money(val(k)) + '</b></li>'; }).concat(D.expenses.filter(function (e) { return e.c === c; }).map(function (e) { return '<li class="entry"><span class="n">+ ' + esc(t.add) + '</span><b>' + money(e.a) + '</b></li>'; })).join("") + '</ul>';
    h += '</div>';
  });
  h += '</div><div class="sheet" data-d="money"><h3>' + esc(t.add) + '</h3><div class="fields"><div class="field"><label for="mamt">' + esc(t.amount) + '</label><input id="mamt" type="number" inputmode="numeric" min="1" max="100000000" value="' + qdef() + '"></div><div class="field"><span class="lb" id="mcat-l" style="font-size:13px;font-weight:600;color:var(--text-2)">' + esc(t.cat) + '</span><button class="pickbtn" type="button" id="mcat" data-fid="mcatb" data-act="pickcat" aria-haspopup="dialog" aria-labelledby="mcat-l mcat-v"><span class="tile" aria-hidden="true">' + ICON["c_" + D.qcat] + '</span><span class="pl" id="mcat-v">' + esc(t.cats[D.qcat]) + '</span>' + ICON.chev + '</button></div></div><button class="btn primary" data-fid="madd" data-act="madd">' + esc(t.addBtn) + '</button><p class="ok-note" role="status">' + (D.lastAdd ? esc(t.savedMsg) : "") + '</p></div><p class="samplenote">' + esc(t.manual) + '</p></div>';
  var keep = $("#mamt") ? $("#mamt").value : null;
  $("#moneyui").innerHTML = h; if (keep && D.keepAmt) $("#mamt").value = keep;
}
function secCircle() { return demoScreen("circle", "circleui"); }
function renderCircle() {
  var t = T.circle, cols = { sam: "#2563eb", mom: "#0f7a4a", dee: "#8a5a00" }, ar = ["today", "train", "food", "money"];
  var h = '<div class="app"><p class="samplenote" style="margin:0">' + esc(t.tip) + '</p><div class="list">' + ["sam", "mom", "dee"].map(function (p) { return '<button class="person" data-fid="pp-' + p + '" data-act="person" data-p="' + p + '" aria-pressed="' + (D.person === p) + '"><span class="ava" style="background:' + cols[p] + '" aria-hidden="true">' + esc(t.people[p].charAt(0)) + '</span><span><b>' + esc(t.people[p]) + '</b></span></button>'; }).join("") + '</div>';
  var P = D.person, vis = ar.filter(function (a) { return D.perm[P][a]; });
  h += '<h3>' + esc(f(t.sees, { who: t.people[P].split(" ")[0] })) + '</h3>' + ar.map(function (a) { return '<div class="switch"><span id="lb-' + a + '">' + esc(t.areas[a]) + ' <small style="color:var(--text-2)">\u00b7 ' + esc(D.perm[P][a] ? t.on : t.off) + '</small></span><button class="sw" data-fid="sw-' + a + '" role="switch" aria-checked="' + !!D.perm[P][a] + '" aria-labelledby="lb-' + a + '" data-act="perm" data-a="' + a + '"></button></div>'; }).join("");
  h += '<h3>' + esc(t.preview) + '</h3><div class="preview">' + (vis.length ? '<ul class="list">' + vis.map(function (a) { return '<li class="item"><span class="n">' + esc(t.areas[a]) + '</span></li>'; }).join("") + '</ul>' : '<span class="samplenote">' + esc(t.previewEmpty) + '</span>') + '</div></div>';
  $("#circleui").innerHTML = h;
}
/* ---------- avatars (real Kit 9 engine) ---------- */
function secAv() {
  return head("avatars", hd(T.av.h, T.av.lead)) + task("t_avatar", T.av.task) + '<div class="stagewrap"><div class="stage" id="avui"></div></div>';
}
var AVTOK = 0;
function avInit() { var K = window.RVKit; if (!K) { $("#avui").innerHTML = '<p role="alert">' + esc(T.av.loadFail) + '</p>'; return; } D.av = { origin: "vela", state: JSON.parse(JSON.stringify(K.KIT_PRESET_STATE.vela)), touched: false }; renderAv(); drawAv(); }
function renderAv() {
  var K = window.RVKit, A = D.av, a = T.av, base = "../assets/avatars/exports/128/";
  var h = '<div class="avwrap"><div><img class="avimg" id="avimg" alt="" width="200" height="200"><p class="status" id="avst" role="status"></p><button class="btn" data-act="avreset" style="width:100%">' + esc(a.reset) + '</button></div><div class="cats"><div><h3>' + esc(a.looks) + '</h3><div class="looks">' + K.AVATAR_PRESET_IDS.map(function (id) { return '<button class="look" data-fid="look-' + id + '" data-act="look" data-id="' + id + '" aria-pressed="' + (A.origin === id) + '" aria-label="' + esc(lookName(id, K.AVATAR_PRESET_NAMES[id])) + '"><img src="' + base + id + '.png" alt="" width="64" height="64"></button>'; }).join("") + '</div></div><h3 style="margin:0">' + esc(a.path1) + '</h3>';
  K.KIT_CATEGORIES.forEach(function (c) {
    var pal = c === "skin" || c === "hairColor" || c === "eyeColor", val0 = A.state[c];
    h += '<div><h3 id="cl-' + c + '">' + esc(a.cat[c]) + '</h3><div class="sw-row" role="group" aria-labelledby="cl-' + c + '">' + K.KIT_OPTIONS[c].map(function (o) { return pal ? '<button class="swatch" data-fid="o-' + c + '-' + o.id + '" data-act="opt" data-c="' + c + '" data-v="' + o.id + '" style="background:' + o.hex + '" aria-pressed="' + (val0 === o.id) + '" aria-label="' + esc(kn(c, o)) + '" title="' + esc(kn(c, o)) + '"></button>' : '<button class="opt" data-fid="o-' + c + '-' + o.id + '" data-act="opt" data-c="' + c + '" data-v="' + o.id + '" aria-pressed="' + (val0 === o.id) + '">' + esc(kn(c, o)) + '</button>'; }).join("") + '</div></div>';
  });
  h += '<p class="samplenote">' + esc(a.future) + '</p></div></div>';
  h += '<div class="photo card"><h3>' + esc(a.path2) + '</h3><p class="lead" style="font-size:.95rem"><b>' + esc(a.photoH) + '</b><br>' + esc(a.photoBody) + '</p><label class="row" style="min-height:44px"><input type="checkbox" id="pconsent" style="width:24px;height:24px"' + (D.consent ? " checked" : "") + '> <span>' + esc(a.consent) + '</span></label><div class="row" style="margin-top:8px"><label class="btn' + (D.consent ? "" : " ghost") + '" id="plabel" ' + (D.consent ? "" : 'aria-disabled="true"') + ' style="' + (D.consent ? "" : "opacity:.5;") + '">' + esc(a.choose) + '<input id="pfile" type="file" accept="image/*" hidden ' + (D.consent ? "" : "disabled") + '></label><button class="btn" data-act="cam" ' + (D.consent && navigator.mediaDevices ? "" : "disabled") + '>' + esc(a.camera) + '</button></div><div id="camwrap"></div><div id="pres" role="status"></div></div>';
  $("#avui").innerHTML = h;
}
function drawAv() {
  var K = window.RVKit, A = D.av, tok = ++AVTOK, img = $("#avimg"), st = $("#avst"); if (!img) return;
  st.textContent = T.av.render;
  K.renderAvatar(A.origin, K.kitColors(A.origin, A.state), A.state, 512).then(function (u) { if (tok !== AVTOK) return; img.src = u; img.alt = ""; st.textContent = ""; }).catch(function () { if (tok === AVTOK) st.textContent = T.av.renderFail; });
}
function stopCam() { if (D.stream) { D.stream.getTracks().forEach(function (t) { t.stop(); }); D.stream = null; } var w = $("#camwrap"); if (w) w.innerHTML = ""; }
function handlePhoto(src, w, h) {
  var K = window.RVKit, pres = $("#pres"); var s = K.sampleRegions(src, w, h);
  if (!s.skin && !s.hair) { pres.innerHTML = '<p>' + esc(T.av.noFace) + '</p>'; return; }
  K.closestLooks(s).then(function (ids) {
    var ns = K.nearestKitColor("skin", s.skin), nh = K.nearestKitColor("hairColor", s.hair); D.photoPick = { skin: ns && ns.id, hair: nh && nh.id };
    pres.innerHTML = '<h3>' + esc(T.av.closest) + '</h3><div class="closest">' + ids.map(function (id) { return '<button class="look" data-fid="cl3-' + id + '" data-act="pick" data-id="' + id + '" aria-label="' + esc(lookName(id, K.AVATAR_PRESET_NAMES[id])) + '"><img src="../assets/avatars/exports/128/' + id + '.png" alt=""></button>'; }).join("") + '</div><p class="samplenote">' + esc(T.av.photoNote) + '</p>';
  });
  S.photo = "tried"; save();
}
/* ---------- more features, ideas ---------- */
function secSup() {
  var s = T.sup;
  return head("support", hd(s.h, s.lead)) + '<div class="sup" style="margin-top:24px">' +
    [["rec", s.rec, s.recT, s.recB, '<div class="kpi"><div><span>' + esc(s.sleep) + '</span><b>' + s.hrs + '</b></div></div><p>' + esc(s.rest) + '</p>', "recovery"], ["hea", s.hea, s.heaT, s.heaB, '<p class="item" style="margin:0">' + esc(s.rem) + '</p>', "recovery"], ["cal", s.cal, s.calT, s.calB, '<p class="item" style="margin:0"><span class="t">19:30</span> ' + esc(s.ev) + '</p>', "today"]].map(function (x) { return '<div class="card" data-d="' + x[5] + '"><span class="badge">' + esc(x[1]) + '</span><h3 style="margin-top:8px">' + esc(x[2]) + '</h3><p class="lead" style="font-size:.95rem">' + esc(x[3]) + '</p>' + x[4] + '</div>'; }).join("") + '</div>' + note();
}
function secCon() {
  var c = T.con;
  return head("concepts", hd(G18.conPick.h, c.lead) + '<p><span class="badge concept">' + esc(c.rule) + '</span></p><p class="hint">' + esc(G18.conPick.hint) + '</p>') + '<div class="qlist" role="group" aria-label="' + esc(G18.conPick.h) + '" id="conlist"></div>';
}
function renderCon() {
  var c = T.con, n = CONCEPTS.filter(function (k) { return S.concepts[k] && S.concepts[k].useful === "yes"; }).length;
  $("#conlist").innerHTML = CONCEPTS.map(function (k) {
    var on = !!(S.concepts[k] && S.concepts[k].useful === "yes");
    return '<button class="ans concept" type="button" data-fid="con-' + k + '" data-act="con" data-k="' + k + '" aria-pressed="' + on + '"><span class="ct"><b>' + esc(c[k][0]) + '</b><span>' + esc(c[k][1]) + '</span><span class="badge concept" style="justify-self:start">' + esc(c.tag) + '</span></span><span class="ac">' + ICON.check + '</span></button>';
  }).join("");
}
function labelFor(id, v) {
  if (v === "none") return G18.q[QCFG[id].none];
  if (AREA7.indexOf(v) >= 0) return T.steps[v];
  if (G18.q[v]) return G18.q[v];
  return G18.q["r_" + v];
}
function secQ(id) {
  var c = QCFG[id], q = G18.q[c.k];
  return head(id, hd(q.h) + '<p class="hint">' + esc(q.hint) + '</p>') + '<div class="qlist two" role="' + (c.multi ? "group" : "radiogroup") + '" aria-label="' + esc(q.h) + '" id="ql-' + id + '"></div>' + (id === "q_apps" ? '<div class="field" style="margin-top:20px"><label for="f-appsnote">' + esc(G18.q.appsNote) + ' <span class="badge">' + esc(T.optional) + '</span></label><textarea id="f-appsnote" maxlength="400" placeholder="' + esc(G18.rate.ph) + '"></textarea></div>' : "");
}
function renderQ(id) {
  if (id === "q_apps" && $("#f-appsnote")) $("#f-appsnote").value = S.final.appsNote || "";
  var c = QCFG[id], cur = S.final[c.k], opts = c.opts.concat(c.none ? ["none"] : []);
  $("#ql-" + id).innerHTML = opts.map(function (v) {
    var on = c.multi ? cur.indexOf(v) >= 0 : cur === v, ic = AREA7.indexOf(v) >= 0 ? ICON[v] : v === "nav" ? ICON.nav : v === "lang" ? ICON.lang : "";
    return '<button class="ans" type="button" ' + (c.multi ? 'aria-pressed="' + on + '"' : 'role="radio" aria-checked="' + on + '"') + ' data-fid="q-' + id + '-' + v + '" data-act="qopt" data-q="' + id + '" data-v="' + v + '">' + (ic ? '<span class="tile" data-d="' + (DEST.indexOf(v) >= 0 ? v : v === "support" ? "recovery" : "today") + '">' + ic + '</span>' : "") + '<span class="al">' + esc(labelFor(id, v)) + '</span><span class="ac">' + ICON.check + '</span></button>';
  }).join("");
}
function secSubmit() {
  var s = G18.sub;
  return head("submit", hd(s.h, s.lead)) + '<div class="subcard" id="subcard"></div>';
}
function renderSubmit() {
  var s = G18.sub, el = $("#subcard"); if (!el) return;
  if (S.complete) {
    el.innerHTML = '<div class="thanks card"><div class="check" style="width:40px;height:40px;border-radius:50%;background:var(--positive);color:#fff;display:grid;place-items:center">' + ICON.check + '</div><b>' + esc(s.thanks) + '</b><p style="margin:0">' + esc(G.kept ? s.already : s.thanksBody) + '</p><p class="samplenote">' + esc(s.ref) + ': <code>' + esc(S.sid.slice(0, 8)) + '</code></p><div class="row"><button class="btn ghost" type="button" data-act="del">' + esc(s.del) + '</button></div></div>';
    return;
  }
  if (CLOSED) { el.innerHTML = '<div class="resume" role="status"><p>' + esc(G18.closed) + '</p></div>'; return; }
  el.innerHTML = '<div class="field"><label for="f-note">' + esc(s.comment) + ' <span class="badge">' + esc(T.optional) + '</span></label><textarea id="f-note" data-act="fin" maxlength="800" placeholder="' + esc(G18.rate.ph) + '">' + esc(S.final.note || "") + '</textarea></div><button class="btn primary" id="send" data-act="send" type="button">' + esc(s.sendBtn) + '</button><div id="fout" role="status" aria-live="polite"></div>';
}

/* ---------- mount ---------- */
var sections = { landing: secLanding, about: secAbout, onboarding: secOnb, today: secToday, train: secTrain, food: secFood, money: secMoney, circle: secCircle, avatars: secAv, support: secSup, concepts: secCon, q_first: function () { return secQ("q_first"); }, q_apps: function () { return secQ("q_apps"); }, q_barriers: function () { return secQ("q_barriers"); }, q_pay: function () { return secQ("q_pay"); }, q_areas: function () { return secQ("q_areas"); }, q_confusing: function () { return secQ("q_confusing"); }, q_remove: function () { return secQ("q_remove"); }, q_missing: function () { return secQ("q_missing"); }, q_regular: function () { return secQ("q_regular"); }, submit: secSubmit };
function mount() {
  FLOW.forEach(function (id) { var el = document.getElementById(id); el.innerHTML = id === "landing" ? sections[id]() : '<div class="wrap">' + sections[id]() + '</div>'; });
  $("#stepper").innerHTML = DEST.map(function (id) { return '<a href="#' + id + '" data-step="' + id + '" data-d="' + id + '" data-act="dest">' + ICON[id] + '<span>' + esc(T.steps[id]) + '</span></a>'; }).join("");
  renderWeb(); renderPartial(); renderResume(); renderAbout(); renderOnb(); renderToday(); renderTrain(); renderFood(); renderMoney(); renderCircle(); avInit(); renderCon();
  Object.keys(QCFG).forEach(renderQ); renderSubmit(); TASKS.forEach(refreshTask); paintReached();
}
function renderAll() {
  demoSave();
  var a = document.activeElement, fid = a && a.dataset && a.dataset.fid;
  renderToday(); renderTrain(); renderFood(); renderMoney(); renderCircle();
  if (fid) { var n = $('[data-fid="' + fid + '"]'); if (n) n.focus(); }
}
function paintReached() { $$("#stepper a").forEach(function (a) { a.classList.toggle("reached", S.reached.indexOf(a.dataset.step) >= 0); }); }

/* ---------- guided navigation: one screen at a time ---------- */
var G = { i: 0, rt: null, kept: false, rate: null };
function answered(id) {
  var c = QCFG[id]; if (id === "onboarding") return !!D.obDone;
  if (!c) return true;
  return c.multi ? S.final[c.k].length > 0 : !!S.final[c.k];
}
function updBar() {
  var id = FLOW[G.i], nx = $("#gnext"), sk = $("#gskip");
  if (!nx) return;
  var last = id === "submit";
  nx.hidden = last; sk.hidden = last;
  nx.disabled = !answered(id);
  nx.textContent = G18.next; sk.textContent = G18.skip; $("#gback").textContent = G18.back;
}
function go(i, o) {
  o = o || {};
  i = Math.max(0, Math.min(FLOW.length - 1, i));
  var id = FLOW[i], prev = G.i;
  document.body.dataset.dir = i < prev ? "back" : "fwd";
  if (FLOW[prev] === "avatars" && id !== "avatars") stopCam();
  G.i = i; if (i > 0) S.step = i; saveLocal();
  FLOW.forEach(function (x) { var s = document.getElementById(x); s.classList.toggle("cur", x === id); s.hidden = x !== id; });
  document.body.classList.toggle("at-landing", i === 0);
  document.body.classList.toggle("sent", id === "submit" && S.complete);
  $$("#stepper a").forEach(function (a) { var on = a.dataset.step === id; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current"); });
  var pg = $("#prog"); if (pg) pg.style.width = Math.round(i / (FLOW.length - 1) * 100) + "%";
  document.title = "RYVANO \u00b7 " + (id === "landing" ? T.hero.eyebrow : stepLabel(id));
  TASKS.forEach(function (t) { if (document.getElementById(id).querySelector('[data-task="' + t + '"]') && !taskStart[t]) taskStart[t] = Date.now(); });
  if (id === "landing") renderResume();
  if (id === "submit") renderSubmit();
  if (!o.nopush) { try { history.pushState({ i: i }, "", i === 0 ? location.pathname + location.search : "#" + id); } catch (e) { } }
  clearTimeout(G.rt); G.rt = setTimeout(function () { if (S.reached.indexOf(id) < 0) { S.reached.push(id); paintReached(); save(); } }, 1000);
  updBar(); hdr();
  window.scrollTo(0, 0);
  var h2 = $("#" + id + " h1") || $("#" + id + " h2"); if (h2 && !o.noFocus) { h2.setAttribute("tabindex", "-1"); h2.focus({ preventScroll: true }); }
}
function hdr() { var h = $(".top"); if (h) document.documentElement.style.setProperty("--hh", h.offsetHeight + "px"); var b = $("#gbar"); if (b && b.offsetHeight) document.documentElement.style.setProperty("--bar-h", b.offsetHeight + "px"); }
function advance() { go(G.i + 1); }
function onNext() {
  var id = FLOW[G.i];
  if (RATED[id] && !S.asked[id]) { openRate(id); return; }
  advance();
}
function onSkip() { var id = FLOW[G.i]; if (RATED[id]) S.asked[id] = 1; saveLocal(); advance(); }
window.addEventListener("popstate", function () { var id = (location.hash || "").slice(1), i = FLOW.indexOf(id); go(i >= 0 ? i : 0, { nopush: true, noFocus: true }); });
window.addEventListener("resize", hdr);

/* ---------- sheets: native dialog (focus trap, Esc, backdrop) with enter/exit motion ---------- */
function closeSheet(d, cb) {
  if (!d.open) { cb && cb(); return; }
  var done = function () { d.classList.remove("out"); if (d.open) d.close(); cb && cb(); };
  if (RM()) { done(); return; }
  d.classList.add("out"); setTimeout(done, 170);
}
function wireSheet(d) {
  d.addEventListener("cancel", function (e) { e.preventDefault(); closeSheet(d); });
  d.addEventListener("click", function (e) { if (e.target === d) closeSheet(d); });
}
function openRate(id) { G.rate = { id: id, p: 0 }; renderRate(); var d = $("#rsheet"); if (!d.open) d.showModal(); focusSheet(d); }
function renderRate() {
  var r = G.rate, id = r.id, g = G18.rate, cur = S.fb[id] || {}, first = r.p === 0, d = $("#rsheet");
  var vals = first ? [["yes", ICON.up], ["no", ICON.down], ["unsure", ICON.q]] : [["easy", ICON.smile], ["ok", ICON.meh], ["confusing", ICON.frown]];
  var key = first ? "useful" : "ease";
  d.innerHTML = '<div class="grab"></div><div class="shead"><h2 id="rt">' + esc(first ? g.u : g.e) + '</h2><button class="btn icon ghost" type="button" data-act="rclose" aria-label="' + esc(g.close) + '">' + ICON.x + '</button></div>' +
    '<div class="sbody"><p class="hint" style="margin:0 12px 4px">' + esc(stepLabel(id)) + '</p><div class="rcards" role="radiogroup" aria-labelledby="rt">' + vals.map(function (v) { var lab = first ? g[v[0]] : (v[0] === "confusing" ? g.hard : g[v[0]]); return '<button class="rc" type="button" role="radio" aria-checked="' + (cur[key] === v[0]) + '" data-act="rate" data-k="' + key + '" data-v="' + v[0] + '" data-fid="rc-' + v[0] + '">' + v[1] + '<span>' + esc(lab) + '</span></button>'; }).join("") + '</div>' +
    (first ? "" : '<div class="rnote"><button class="btn ghost" type="button" data-act="rnotebtn" aria-expanded="' + !!cur.note + '">' + esc(g.comment) + '</button><textarea id="rnote" maxlength="500" placeholder="' + esc(g.ph) + '" aria-label="' + esc(g.comment) + '"' + (cur.note ? "" : " hidden") + '>' + esc(cur.note || "") + '</textarea></div>') + '</div>' +
    '<div class="sfoot"><button class="btn ghost" type="button" data-act="rskip">' + esc(G18.skip) + '</button><button class="btn primary" type="button" data-act="rnext">' + esc(G18.next) + '</button></div>';
  d.setAttribute("aria-labelledby", "rt");
}
function rateDone() { var id = G.rate.id; S.asked[id] = 1; save(); closeSheet($("#rsheet"), function () { G.rate = null; advance(); }); }
function focusSheet(d) { var t = $('[aria-checked="true"],[aria-selected="true"]', d) || $("input,button.rc,button.prow", d); if (t) t.focus(); }
/* picker: replaces native <select>; bottom sheet on phones, anchored panel on larger screens */
var PK = null;
function openPick(o) {
  PK = o; var d = $("#pick");
  d.setAttribute("aria-label", o.title);
  d.innerHTML = '<div class="grab"></div><div class="shead"><h2>' + esc(o.title) + '</h2><button class="btn icon ghost" type="button" data-act="pclose" aria-label="' + esc(G18.rate.close) + '">' + ICON.x + '</button></div>' +
    (o.search ? '<div class="psearch"><input id="pq" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(o.searchPh || "") + '" aria-label="' + esc(o.searchPh || o.title) + '"></div>' : "") +
    '<div class="sbody" id="plist" role="listbox" aria-label="' + esc(o.title) + '"></div>';
  paintPick("");
  d.style.cssText = ""; d.showModal();
  if (window.innerWidth >= 700 && o.anchor) {
    var r = o.anchor.getBoundingClientRect(), w = Math.min(Math.max(r.width, 320), window.innerWidth - 24), hh = d.offsetHeight;
    var left = Math.min(Math.max(12, r.left), window.innerWidth - w - 12), top = r.bottom + 6; if (top + hh > window.innerHeight - 12) top = r.top - hh - 6; top = Math.max(12, Math.min(top, window.innerHeight - hh - 12));
    d.style.cssText = "inset:auto;left:" + left + "px;top:" + top + "px;width:" + w + "px;translate:none";
  }
  var sel = $('.prow[aria-selected="true"]', d); (o.search ? $("#pq") : sel || $(".prow", d)).focus();
  if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
}
function paintPick(q) {
  var o = PK, L = $("#plist"), qq = fold(q.trim());
  var items = o.items.filter(function (it) { return !qq || fold(it.label).indexOf(qq) >= 0; });
  L.innerHTML = items.length ? items.map(function (it) { return '<button class="prow" type="button" role="option" aria-selected="' + (String(it.v) === String(o.value)) + '" data-act="ppick" data-v="' + esc(it.v) + '">' + (it.icon ? '<span class="tile" data-d="' + (it.d || "money") + '" aria-hidden="true">' + it.icon + '</span>' : "") + '<span class="pl">' + esc(it.label) + '</span>' + ICON.ck + '</button>'; }).join("") : '<div class="pnone">' + esc(o.none || "\u2014") + '</div>';
}
function fold(x) { return String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

/* ---------- events ---------- */
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]"); if (!b) return; var act = b.dataset.act;
  if (act === "start") { go(1); }
  else if (act === "resume") { go(S.step); }
  else if (act === "restart") { S.step = 0; S.asked = {}; saveLocal(); renderResume(); go(1); }
  else if (act === "dest") { e.preventDefault(); go(FLOW.indexOf(b.dataset.step)); }
  else if (act === "gnext") { onNext(); }
  else if (act === "gskip") { onSkip(); }
  else if (act === "gback") { go(G.i - 1); }
  else if (act === "rclose") { closeSheet($("#rsheet")); }
  else if (act === "rskip") { rateDone(); }
  else if (act === "rnext") { if (G.rate.p === 0 && EASEON[G.rate.id]) { G.rate.p = 1; renderRate(); focusSheet($("#rsheet")); } else rateDone(); }
  else if (act === "rate") { var o = S.fb[G.rate.id] || (S.fb[G.rate.id] = {}), k = b.dataset.k; o[k] = o[k] === b.dataset.v ? null : b.dataset.v; $$('.rc', $("#rsheet")).forEach(function (x) { x.setAttribute("aria-checked", String(o[k] === x.dataset.v)); }); save(); }
  else if (act === "rnotebtn") { var ta = $("#rnote"); ta.hidden = !ta.hidden; b.setAttribute("aria-expanded", String(!ta.hidden)); if (!ta.hidden) ta.focus(); }
  else if (act === "pclose") { closeSheet($("#pick")); }
  else if (act === "ppick") { var pk = PK, v = b.dataset.v; closeSheet($("#pick"), function () { pk.onpick(v); }); }
  else if (act === "chglang") { $("#langbtn").click(); }
  else if (act === "age") { S.profile.age = S.profile.age === b.dataset.v ? "" : b.dataset.v; renderAbout(); $('[data-fid="age-' + b.dataset.v + '"]').focus(); save(); }
  else if (act === "int") { var ii = S.profile.interests, ix = ii.indexOf(b.dataset.v); if (ix >= 0) ii.splice(ix, 1); else ii.push(b.dataset.v); renderAbout(); $('[data-fid="int-' + b.dataset.v + '"]').focus(); save(); }
  else if (act === "pickctry") {
    var codes = CTRY.slice().sort(function (a, c) { return regionName(a).localeCompare(regionName(c), REG.app); });
    var enR; try { enR = new Intl.DisplayNames(["en"], { type: "region" }); } catch (e) { enR = null; }
    LangSel.open({ title: G18.about.country, placeholder: G18.about.countrySearch, none: G18.about.countryNone, closeLabel: (APP && APP["action.close"]) || "Close", uiLocale: REG.app === "en-US" ? "en" : REG.app, current: S.profile.country,
      items: codes.map(function (c) { var en = ""; try { en = enR ? enR.of(c) : ""; } catch (e) { } return { code: c, n: regionName(c), s: "", alt: en, lang: REG.app === "en-US" ? "en" : REG.app }; }),
      onPick: function (v) { S.profile.country = S.profile.country === v ? "" : v; renderAbout(); var cb = $('[data-fid="ctry"]'); if (cb) cb.focus({ preventScroll: true }); save(); } });
  }
  else if (act === "pickcat") { openPick({ title: G18.pick.cat, value: D.qcat, anchor: b, items: CATS.map(function (c) { return { v: c, label: T.money.cats[c], icon: ICON["c_" + c] }; }), onpick: function (v) { D.qcat = v; var am = $("#mamt").value; renderMoney(); $("#mamt").value = am; $('[data-fid="mcatb"]').focus(); } }); }
  else if (act === "pickex") { openPick({ title: G18.pick.ex, value: D.ex, anchor: b, items: [1, 2, 3].map(function (i) { return { v: i, label: T.train["ex" + i], icon: ICON.dumbbell, d: "train" }; }), onpick: function (v) { D.ex = +v; renderTrain(); $('[data-fid="texb"]').focus(); } }); }
  else if (act === "qopt") {
    var id = b.dataset.q, c = QCFG[id], v2 = b.dataset.v;
    if (c.multi) { var arr = S.final[c.k], j = arr.indexOf(v2); if (v2 === "none") S.final[c.k] = j >= 0 ? [] : ["none"]; else { if (arr.indexOf("none") >= 0) arr.splice(arr.indexOf("none"), 1); j = arr.indexOf(v2); if (j >= 0) arr.splice(j, 1); else if (!c.max || arr.length < c.max) arr.push(v2); } }
    else S.final[c.k] = S.final[c.k] === v2 ? "" : v2;
    renderQ(id); $('[data-fid="q-' + id + "-" + v2 + '"]').focus(); updBar(); save();
  }
  else if (act === "con") { var k0 = b.dataset.k, cc = S.concepts[k0] || (S.concepts[k0] = {}), n0 = CONCEPTS.filter(function (x) { return S.concepts[x] && S.concepts[x].useful === "yes"; }).length; if (cc.useful === "yes") cc.useful = null; else if (n0 < 3) cc.useful = "yes"; renderCon(); $('[data-fid="con-' + k0 + '"]').focus(); save(); }
  else if (act === "tstuck" || act === "tskip") { var tid = b.dataset.t; S.tasks[tid] = { done: act === "tstuck" ? "stuck" : "skipped", ms: Date.now() - (taskStart[tid] || T0) }; refreshTask(tid); save(); }
  else if (act === "webmove") { D.moved = !D.moved; renderWeb(); renderAll(); }
  else if (act === "oba") { var a = b.dataset.a, i = D.areas.indexOf(a); if (i >= 0) D.areas.splice(i, 1); else D.areas.push(a); renderOnb(); $('[data-a="' + a + '"]').focus(); }
  else if (act === "obc") { D.circleMode = b.dataset.m; renderOnb(); $('[data-m="' + b.dataset.m + '"]').focus(); }
  else if (act === "obn") { if (ob.n === 1) { if (b.dataset.skip) { D.name = ""; } else { D.name = ($("#obname").value || "").trim().slice(0, 24); } D.goal = +$("#obgoal").value; } if (ob.n < 2) ob.n++; else { D.obDone = true; } renderOnb(); renderAll(); updBar(); var nb = $('#onb [data-act="obn"]:not([data-skip])'); nb && nb.focus(); }
  else if (act === "obb") { ob.n = Math.max(0, ob.n - 1); renderOnb(); }
  else if (act === "ttab") { D.tab = b.dataset.k; renderToday(); $('[data-fid="tt-' + D.tab + '"]').focus(); }
  else if (act === "prio") { var k2 = b.dataset.k; D.prio[k2] = !D.prio[k2]; if (k2 === "p2") D.workout = D.prio.p2 || D.workout; renderAll(); completeTask("t_today"); }
  else if (act === "tsave") { var nm = T.train["ex" + D.ex]; D.workout = true; D.prio.p2 = true; D.lastSaved = true; D.workouts.unshift(nm + " \u00b7 " + $("#tse").value + " \u00d7 " + $("#tre").value + " \u00b7 " + $("#tkg").value + " kg"); renderAll(); completeTask("t_train"); }
  else if (act === "meal") { var m = b.dataset.m, j2 = D.meals.indexOf(m); if (j2 < 0) D.meals.push(m); else D.meals.splice(j2, 1); renderAll(); if (j2 < 0) completeTask("t_food"); }
  else if (act === "cat") { var c2 = b.dataset.c; D.open = D.open === c2 ? null : c2; renderAll(); if (D.open) completeTask("t_money"); }
  else if (act === "madd") { var amt = Math.round(Math.min(1e8, Math.max(1, +$("#mamt").value || 0))); D.expenses.push({ c: D.qcat, a: amt }); D.lastAdd = true; D.open = D.qcat; renderAll(); completeTask("t_money"); }
  else if (act === "person") { D.person = b.dataset.p; renderCircle(); $('[data-fid="pp-' + D.person + '"]').focus(); }
  else if (act === "perm") { var ar = b.dataset.a; D.perm[D.person][ar] = !D.perm[D.person][ar]; renderCircle(); $('[data-fid="sw-' + ar + '"]').focus(); completeTask("t_circle"); }
  else if (act === "look") { var K = window.RVKit; D.av.origin = b.dataset.id; D.av.state = JSON.parse(JSON.stringify(K.KIT_PRESET_STATE[b.dataset.id])); renderAv(); drawAv(); $('[data-fid="look-' + b.dataset.id + '"]').focus(); completeTask("t_avatar"); }
  else if (act === "opt") { D.av.state[b.dataset.c] = b.dataset.v; renderAv(); drawAv(); $('[data-fid="o-' + b.dataset.c + "-" + b.dataset.v + '"]').focus(); completeTask("t_avatar"); }
  else if (act === "avreset") { var K2 = window.RVKit; D.av.state = JSON.parse(JSON.stringify(K2.KIT_PRESET_STATE[D.av.origin])); renderAv(); drawAv(); }
  else if (act === "pick") { var K3 = window.RVKit, id3 = b.dataset.id; D.av.origin = id3; D.av.state = JSON.parse(JSON.stringify(K3.KIT_PRESET_STATE[id3])); if (D.photoPick) { if (D.photoPick.skin) D.av.state.skin = D.photoPick.skin; if (D.photoPick.hair) D.av.state.hairColor = D.photoPick.hair; } renderAv(); drawAv(); completeTask("t_avatar"); $("#avimg").scrollIntoView({ block: "nearest" }); }
  else if (act === "cam") { camStart(); }
  else if (act === "snap") { var v3 = $("#camvid"); var cv = document.createElement("canvas"); cv.width = v3.videoWidth; cv.height = v3.videoHeight; cv.getContext("2d").drawImage(v3, 0, 0); stopCam(); handlePhoto(cv, cv.width, cv.height); cv.width = cv.height = 0; }
  else if (act === "camcancel") { stopCam(); }
  else if (act === "send") { sendFinal(); }
  else if (act === "del") { delAll(); }
  else if (act === "priv") { $("#privdlg").showModal(); }
  else if (act === "retry") { flush(); }
  else if (act === "shot") { var a2 = b.dataset.a; $$("#scr img").forEach(function (im) { im.classList.toggle("on", im.dataset.a === a2); }); $$('[data-act="shot"]').forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); }
  else if (act === "theme") { var cur2 = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = cur2; ls("rv.theme", cur2); themeBtn(); }
});
document.addEventListener("change", function (e) {
  var t = e.target;
  if (t.id === "pconsent") { D.consent = t.checked; renderAv(); drawAv(); if ($("#pconsent")) $("#pconsent").focus(); }
  if (t.id === "pfile" && t.files && t.files[0]) {
    var file = t.files[0], url = URL.createObjectURL(file), im = new Image();
    im.onload = function () { try { handlePhoto(im, im.naturalWidth, im.naturalHeight); } finally { URL.revokeObjectURL(url); im.src = ""; t.value = ""; } };
    im.onerror = function () { URL.revokeObjectURL(url); $("#pres").innerHTML = '<p>' + esc(T.av.noFace) + '</p>'; };
    im.src = url;
  }
  if (t.id === "obgoal") { $("#obgv").textContent = t.value; }
});
document.addEventListener("input", function (e) {
  var t = e.target;
  if (t.id === "p-nick") { S.profile.nick = t.value.slice(0, 24); save(); }
  if (t.id === "rnote" && G.rate) { (S.fb[G.rate.id] || (S.fb[G.rate.id] = {})).note = t.value.slice(0, 500); save(); }
  if (t.id === "f-appsnote") { S.final.appsNote = t.value.slice(0, 400); save(); }
  if (t.id === "f-note") { S.final.note = t.value.slice(0, 800); save(); }
  if (t.id === "pq") paintPick(t.value);
  if (t.id === "obgoal") $("#obgv").textContent = t.value;
});
document.addEventListener("keydown", function (e) {
  var d = e.target.closest && e.target.closest("dialog#pick"); if (!d) return;
  var rows = $$(".prow", d); if (!rows.length) return; var i = rows.indexOf(document.activeElement);
  if (e.key === "ArrowDown") { e.preventDefault(); rows[Math.min(rows.length - 1, i + 1)].focus(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0 && $("#pq")) $("#pq").focus(); else rows[Math.max(0, i - 1)].focus(); }
  else if (e.key === "Home" && i >= 0) { e.preventDefault(); rows[0].focus(); }
  else if (e.key === "End" && i >= 0) { e.preventDefault(); rows[rows.length - 1].focus(); }
  else if (e.key === "Enter" && e.target.id === "pq") { e.preventDefault(); rows[0].click(); }
});
function camStart() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(function (st) {
    D.stream = st; $("#camwrap").innerHTML = '<video id="camvid" playsinline muted></video><div class="row" style="margin-top:8px"><button class="btn primary" data-act="snap">' + esc(T.av.take) + '</button><button class="btn" data-act="camcancel">' + esc(T.av.cancel) + '</button></div>'; var v = $("#camvid"); v.srcObject = st; v.play();
  }).catch(function () { $("#pres").innerHTML = '<p>' + esc(T.av.noFace) + '</p>'; });
}
/* single final submission: recorded once per review session (the server refuses a second completed write) */
function sendFinal() {
  var s = G18.sub, b = $("#send"), out = $("#fout"); if (!b || b.disabled) return; b.disabled = true; b.textContent = s.sending; out.textContent = "";
  var p = payload(); p.complete = true; clearTimeout(timer);
  post(p).then(function (j) {
    S.complete = true; G.kept = !!j.kept; dirty = false; saveLocal(); document.body.classList.add("sent"); renderSubmit(); toast(G18.toastSaved);
    var t = $("#subcard .thanks b"); if (t) t.focus && t.setAttribute("tabindex", "-1"), t.focus();
  }).catch(function () { out.innerHTML = '<p role="alert" style="color:var(--critical-text);margin:0"><b>' + esc(s.err) + '</b></p>'; b.disabled = false; b.textContent = s.sendBtn; });
}
function delAll() {
  var s = G18.sub; if (!confirm(s.delAsk)) return;
  fetch(DEL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sid: S.sid, rc: RC }) }).then(function (r) { return r.json(); }).then(function (j) {
    if (j.ok || (j && j.error === "closed")) { ls("rv.draft", null); ls("rv.sid", null); S = blank(); S.sid = rid(); ls("rv.sid", S.sid); dirty = false; setStatus(""); document.body.classList.remove("sent"); if ($("#privdlg").open) $("#privdlg").close(); Object.keys(QCFG).forEach(renderQ); renderAbout(); renderCon(); renderSubmit(); renderResume(); go(0); toast(G18.toastDeleted); }
  }).catch(function () { toast(s.err); });
}
function themeBtn() { var b = $("#theme"); if (!b) return; var dk = document.documentElement.dataset.theme === "dark"; b.innerHTML = dk ? ICON.sun : ICON.moon; b.setAttribute("aria-label", T.themeLabel); b.title = T.themeLabel; }
function reveal() {
  var els = $$("#landing .kicker, #landing h2, #landing .lead").filter(function (e) { return !e.classList.contains("rv"); });
  els.forEach(function (e) { e.classList.add("rv"); });
  if (!("IntersectionObserver" in window)) { $$(".rv").forEach(function (e) { e.classList.add("in"); }); return; }
  var ro = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); } }); }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  $$(".rv").forEach(function (e) { ro.observe(e); });
}
/* ---------- language selector: the canonical LangSel component (shared with the portal and Chase) ---------- */
function pickLang(code) {
  ls("rv.lang", code); saveLocal(); if (!S.complete) save(true);
  location.href = "../" + code + "/" + location.search + (G.i > 0 ? "#" + FLOW[G.i] : "");
}
function initLang() {
  var a = APP, b = $("#langbtn"); if (!b) return;
  $("#langcur").innerHTML = '<span class="lfull">' + esc(REG.endonym) + '</span><span class="lshort" aria-hidden="true">' + esc(REG.code.split("-")[0].toUpperCase()) + '</span>';
  b.setAttribute("aria-label", (a["settings.language"] || "Language") + ": " + REG.endonym);
  b.addEventListener("click", function () {
    LangSel.open({ title: a["settings.language"] || T.langLabel || "Language", placeholder: a["language.search"] || "Search", closeLabel: a["action.close"] || "Close", uiLocale: REG.app === "en-US" ? "en" : REG.app, current: LANG, onPick: pickLang,
      items: window.LOCALES_REG.map(function (r) { return { code: r.code, n: r.endonym, s: r.en, lang: r.code === "en" ? "en" : r.app, rtl: r.rtl }; }) });
  });
}
initLang();
/* ---------- chrome that is created here so the build stays simple ---------- */
function chrome() {
  var b = document.body;
  b.insertAdjacentHTML("beforeend", '<div id="toast" role="status" aria-live="polite"></div><dialog id="rsheet" class="sh"></dialog><dialog id="pick" class="sh"></dialog><div id="gbar"><div class="in"><button class="btn ghost" id="gback" type="button" data-act="gback"></button><span class="sp"></span><button class="btn ghost" id="gskip" type="button" data-act="gskip"></button><button class="btn primary" id="gnext" type="button" data-act="gnext"></button></div></div>');
  wireSheet($("#rsheet")); wireSheet($("#pick"));
  $(".top .brand").insertAdjacentHTML("afterend", '<span class="demopill" title="' + esc(G18.demoTitle) + '" aria-label="' + esc(G18.demoTitle) + '">' + esc(G18.demo) + '</span>');
  $("#stepper").setAttribute("aria-label", G18.nav);
}
document.title = "RYVANO \u00b7 " + T.hero.eyebrow;
$("#banner").textContent = T.reviewBanner; (function () { var b = $(".banner"); b.setAttribute("role", "region"); b.setAttribute("aria-label", "RYVANO"); })(); $("#privbtn").textContent = T.privacyLink; $("#foot").textContent = T.foot;
$("#privdlg").innerHTML = '<h2 style="font-size:1.4rem">' + esc(T.priv.h) + '</h2><ul>' + T.priv.b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul><p><button class="btn ghost" type="button" data-act="del">' + esc(G18.sub.del) + '</button></p><form method="dialog"><button class="btn primary">' + esc(T.priv.close) + '</button></form>';
$("#retry").textContent = T.retry; $("#skiplink").textContent = T.skip;
if (QA) { var q = document.createElement("span"); q.className = "badge concept"; q.textContent = "QA"; $(".top .sp").after(q); }
themeBtn(); chrome(); mount(); reveal();
/* a language the review is not translated into shows English review text: say so to assistive technology and keep it left-to-right */
if (T._partial) { $("#banner").setAttribute("lang", "en"); $("#banner").setAttribute("dir", "ltr"); $("main").setAttribute("lang", "en"); if (REG.rtl) $("main").setAttribute("dir", "ltr"); }
document.body.classList.add("g");
var i0 = FLOW.indexOf((location.hash || "").slice(1)); go(i0 > 0 ? i0 : 0, { nopush: true, noFocus: true });
if (i0 > 0) { try { history.replaceState({ i: i0 }, "", "#" + FLOW[i0]); } catch (e) { } }
if (S.step > 0 && !S.complete) save(); /* a returning participant: record the language they are using now */
window.__rv = { S: function () { return S; }, flush: flush, D: D, T: T, go: go, FLOW: FLOW };
})();
