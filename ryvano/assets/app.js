(function () {
"use strict";
var API = "https://ryvano-review-api.kamunlimited999.workers.dev/api/s";
var DEL = "https://ryvano-review-api.kamunlimited999.workers.dev/api/delete";
var VER = "2026-11-23.1";
var LANG = document.documentElement.dataset.lang, T = window.I18N[LANG];
var QA = /[?&]qa=1\b/.test(location.search);
var STEPS = ["landing", "onboarding", "today", "train", "food", "money", "circle", "avatars", "support", "concepts", "final"];
var TASKS = ["t_today", "t_train", "t_food", "t_money", "t_circle", "t_avatar"];
var CONCEPTS = ["c_shared_budget", "c_allowance", "c_lessons", "c_trip_budget", "c_split", "c_trip_photos", "c_family"];
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function f(str, o) { return String(str).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? "" : o[k]; }); }
function money(n) { try { return new Intl.NumberFormat(T._fmt, { style: "currency", currency: T._cur, maximumFractionDigits: 0 }).format(n * T._rate); } catch (e) { return String(Math.round(n * T._rate)); } }
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } return null; }

/* ---------- identity + state (anonymous random id; server is the source of truth) ---------- */
function rid() { var a = new Uint8Array(18); (window.crypto || window.msCrypto).getRandomValues(a); return btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "").slice(0, 24); }
var S = { sid: null, reached: [], fb: {}, tasks: {}, concepts: {}, final: {}, photo: "none", complete: false };
try { var d0 = JSON.parse(ls("rv.draft") || "null"); if (d0 && d0.sid && /^[A-Za-z0-9_-]{16,40}$/.test(d0.sid)) S = Object.assign(S, d0); } catch (e) { }
if (!S.sid) S.sid = ls("rv.sid") || rid();
ls("rv.sid", S.sid);
var T0 = Date.now(), taskStart = {}, mark = {};
function vp() { var w = window.innerWidth; return w < 700 ? "phone" : w < 1100 ? "tablet" : "desktop"; }
function payload() { return { sid: S.sid, ver: VER, lang: LANG, vp: vp(), test: QA, complete: !!S.complete, reached: S.reached, fb: S.fb, tasks: S.tasks, concepts: S.concepts, final: S.final, photo: S.photo, ms: Date.now() - T0 }; }

/* ---------- saving with retry; idempotent on the server by sid ---------- */
var gstatus = $("#gstatus"), timer = null, inflight = false, dirty = false, retryN = 0, retryT = null;
function setStatus(kind) { var m = kind === "saved" ? T.saved : kind === "saving" ? T.saving : kind === "offline" ? T.offline : kind === "fail" ? T.notSaved : ""; if (gstatus) { gstatus.textContent = m; gstatus.dataset.kind = kind; } var r = $("#retry"); if (r) r.hidden = !(kind === "fail" || kind === "offline"); var sb = $("#savebar"); if (sb) sb.hidden = !m; }
function save(immediate) { ls("rv.draft", JSON.stringify(S)); dirty = true; clearTimeout(timer); timer = setTimeout(flush, immediate ? 0 : 900); }
function flush() {
  if (inflight) { return; }
  if (!dirty) return;
  if (navigator.onLine === false) { setStatus("offline"); return; }
  inflight = true; dirty = false; setStatus("saving");
  var body = JSON.stringify(payload());
  return fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: body }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || r.status); return j; }); }).then(function () { inflight = false; retryN = 0; setStatus(dirty ? "saving" : "saved"); if (dirty) flush(); return true; }).catch(function () {
    inflight = false; dirty = true; setStatus("fail"); retryN++; clearTimeout(retryT); retryT = setTimeout(flush, Math.min(60000, 3000 * Math.pow(2, retryN - 1))); return false;
  });
}
window.addEventListener("online", function () { if (dirty) flush(); });
window.addEventListener("pagehide", function () { if (dirty && navigator.sendBeacon) { try { navigator.sendBeacon(API, new Blob([JSON.stringify(payload())], { type: "text/plain" })); } catch (e) { } } });

/* ---------- shared demo state ---------- */
var D = { name: "", areas: ["today", "train", "food", "money", "circle"], goal: 3, circleMode: "me", prio: { p1: false, p2: false, p3: false }, workout: false, workouts: [], meals: [], expenses: [{ c: "fun", a: 6, n: "coffee" }], open: null, tab: "plan", moved: false, person: "sam", perm: { sam: {}, mom: {}, dee: {} }, av: null };
var BASE = { groceries: [262, 400], transport: [71, 150], fun: [118, 200], bills: [480, 600] };
var TX = { groceries: [["Market", 48], ["Bakery", 12], ["Corner store", 31]], transport: [["Bus pass", 40], ["Ride", 14], ["Fuel", 17]], fun: [["Cinema", 22], ["Coffee", 6], ["Book", 18]], bills: [["Electricity", 64], ["Internet", 38], ["Phone", 22]] };
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
function fbw(id, withEase) {
  var cur = S.fb[id] || {};
  function seg(name, vals) { return '<div class="seg" role="group" aria-label="' + esc(name === "useful" ? T.q_useful : T.q_ease) + '">' + vals.map(function (v) { return '<button type="button" data-act="fb" data-s="' + id + '" data-k="' + name + '" data-v="' + v + '" aria-pressed="' + (cur[name] === v) + '">' + esc(T[v]) + '</button>'; }).join("") + '</div>'; }
  return '<div class="fb" data-fb="' + id + '"><div><h3>' + esc(T.q_useful) + ' <span class="badge">' + esc(T.optional) + '</span></h3>' + seg("useful", ["yes", "no", "unsure"]) + '</div>' +
    (withEase ? '<div><h3>' + esc(T.q_ease) + '</h3>' + seg("ease", ["easy", "ok", "confusing"]) + '</div>' : '') +
    '<textarea data-act="note" data-s="' + id + '" placeholder="' + esc(T.notePh) + '" aria-label="' + esc(T.notePh) + '" maxlength="500">' + esc(cur.note || "") + '</textarea></div>';
}
function head(id, extra) { return '<p class="eyebrow">' + esc(f(T.stepOf, { n: STEPS.indexOf(id) + 1, t: STEPS.length })) + ' · ' + esc(T.steps[id]) + '</p>' + (extra || ""); }
var SAMPLE = '<p class="samplenote">' + esc(T.sample) + '</p>';

/* ---------- section builders ---------- */
function secLanding() {
  var H = T.hero;
  return '<div class="hero"><div class="wrap"><div class="grid"><div><p class="eyebrow">' + esc(H.eyebrow) + '</p><h1>' + esc(H.h1) + '</h1><p class="lead">' + esc(H.sub) + '</p><div class="actions"><a class="btn primary" href="#onboarding">' + esc(H.cta) + '</a><a class="btn" href="#final">' + esc(H.cta2) + '</a></div>' +
    '<h3 style="margin-top:28px">' + esc(T.how.h) + '</h3><ul class="how"><li>' + esc(T.how.l1) + '</li><li>' + esc(T.how.l2) + '</li><li>' + esc(T.how.l3) + '</li><li>' + esc(T.how.l4) + '</li></ul></div>' +
    '<div class="stage" aria-live="polite"><div class="apphead"><h3>' + esc(H.demoTitle) + '</h3><span class="badge">' + esc(T.steps.landing) + '</span></div><p class="samplenote" style="margin:4px 0 12px">' + esc(H.demoHint) + '</p><div class="web" id="web"></div><div class="row" style="margin-top:14px"><button class="btn primary" id="webbtn" data-act="webmove"></button><span class="status" id="webstat" role="status"></span></div></div></div>' +
    '<h3 style="margin-top:36px">' + esc(H.real) + '</h3><p class="samplenote" style="margin:0 0 10px">' + esc(H.realNote) + '</p><div class="shots">' + ["today", "train", "food", "money", "circle", "quickadd"].map(function (a) { return '<figure><picture><source media="(prefers-color-scheme: dark)" srcset="../assets/app-screens/' + a + '-dark.webp"><img src="../assets/app-screens/' + a + '-light.webp" alt="' + esc((T.steps[a] || (a === "quickadd" ? "Quick Add" : a))) + '" width="340" height="715" loading="lazy"></picture><figcaption>' + esc(T.steps[a] || "Quick Add") + '</figcaption></figure>'; }).join("") + '</div>' +
    '<div class="card" style="margin-top:28px;max-width:760px">' + fbw("landing", false) + '</div></div></div>';
}
function renderWeb() {
  var H = T.hero, m = D.moved, keys = ["today", "train", "food", "money", "circle"];
  $("#web").className = "web" + (m ? " moved" : "");
  $("#web").innerHTML = keys.map(function (k) { return '<div class="node"><i class="dot"></i><b>' + esc(H[k]) + '</b><span>' + esc(H[k + (m ? "B" : "A")]) + '</span></div>'; }).join("");
  $("#webbtn").textContent = m ? H.back : H.move; $("#webstat").textContent = m ? H.moved : "";
}
function secOnb() {
  return head("onboarding", '<h2>' + esc(T.onb.h) + '</h2><p class="lead">' + esc(T.onb.sub) + '</p>') + '<div class="cols"><div class="stage" id="onb"></div><div><div class="card" id="onbres"></div>' + SAMPLE + '<div class="card" style="margin-top:16px">' + fbw("onboarding", false) + '</div></div></div>';
}
var ob = { n: 0 };
function renderOnb() {
  var o = T.onb, n = ob.n, h = "";
  if (n === 0) h = '<h3>' + esc(o.s1) + '</h3><p class="samplenote">' + esc(o.s1h) + '</p><div class="chips" role="group" aria-label="' + esc(o.s1) + '">' + ["today", "train", "food", "money", "circle"].map(function (a) { return '<button class="chip" type="button" data-act="oba" data-a="' + a + '" aria-pressed="' + (D.areas.indexOf(a) >= 0) + '">' + esc(o.areas[a]) + '</button>'; }).join("") + '</div>';
  if (n === 1) h = '<div class="field"><label for="obname"><b>' + esc(o.s2) + '</b></label><input id="obname" type="text" maxlength="24" autocomplete="off" placeholder="' + esc(o.s2ph) + '" value="' + esc(D.name) + '"><span class="samplenote">' + esc(o.s2h) + '</span></div>';
  if (n === 2) h = '<div class="field"><label for="obgoal"><b>' + esc(o.s3) + ': <output id="obgv">' + D.goal + '</output></b></label><input id="obgoal" type="range" min="0" max="6" value="' + D.goal + '" style="min-height:44px"><span class="samplenote">' + esc(o.s3h) + '</span></div>';
  if (n === 3) h = '<h3>' + esc(o.s4) + '</h3><div class="chips" role="radiogroup" aria-label="' + esc(o.s4) + '"><button class="chip" role="radio" aria-checked="' + (D.circleMode === "me") + '" data-act="obc" data-m="me">' + esc(o.s4a) + '</button><button class="chip" role="radio" aria-checked="' + (D.circleMode === "some") + '" data-act="obc" data-m="some">' + esc(o.s4b) + '</button></div><p class="samplenote">' + esc(o.s4h) + '</p>';
  var dots = [0, 1, 2, 3].map(function (i) { return '<i style="width:' + (i <= n ? 28 : 10) + 'px;height:6px;border-radius:9px;background:' + (i <= n ? "var(--brand)" : "var(--border-strong)") + ';display:inline-block;margin-right:4px;transition:width .3s"></i>'; }).join("");
  h += '<div class="row" style="margin-top:18px;justify-content:space-between"><span aria-hidden="true">' + dots + '</span><span class="row">' + (n > 0 ? '<button class="btn" data-act="obb">' + esc(T.back) + '</button>' : "") + '<button class="btn primary" data-act="obn">' + esc(n === 3 ? o.done : o.cont) + '</button></span></div>';
  $("#onb").innerHTML = h;
  var res = D.obDone ? '<h3>' + esc(o.res) + '</h3><p class="lead" style="font-size:1rem">' + esc(o.resBody) + '</p><p><b>' + esc(D.name ? f(T.today.hi, { name: D.name }) : T.today.hiAnon) + '</b></p><div class="chips">' + D.areas.map(function (a) { return '<span class="pill">' + esc(o.areas[a]) + '</span>'; }).join("") + '<span class="pill">' + esc(f(T.train.goal, { n: D.goal })) + '</span></div>' : '<p class="samplenote">' + esc(o.sub) + '</p>';
  $("#onbres").innerHTML = res;
}
function secToday() {
  return head("today", '<h2>' + esc(T.today.h) + '</h2><p class="lead">' + esc(T.today.lead) + '</p>') + '<div class="cols"><div class="stage" id="todayui"></div><div>' + task("t_today", T.today.task) + SAMPLE + '<div class="card" style="margin-top:16px">' + fbw("today", true) + '</div></div></div>';
}
function plan() {
  var it = [[D.moved ? "19:00" : "07:00", T.today.w, D.workout, "train"], ["12:30", T.today.l, false, "food"]];
  D.meals.forEach(function (m) { it.push(["19:00", T[ "food" ][m], false, "food"]); });
  it.push(["18:00", T.today.e, D.prio.p3, "money"], ["19:30", T.today.d, false, "circle"]);
  it.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  return it;
}
function renderToday() {
  var t = T.today, tab = D.tab, h;
  var spent = D.expenses.reduce(function (s, e) { return s + e.a; }, 0), pd = ["p1", "p2", "p3"].filter(function (k) { return D.prio[k]; }).length;
  h = '<div class="app"><div class="apphead"><h3>' + esc(D.name ? f(t.hi, { name: D.name }) : t.hiAnon) + '</h3><span class="badge">' + esc(t.day) + '</span></div>';
  if (D.areas.length) h += '<div class="chips">' + D.areas.map(function (a) { return '<span class="pill">' + esc(T.onb.areas[a]) + '</span>'; }).join("") + '</div>';
  h += '<div class="tabs" role="tablist">' + ["plan", "prio", "recap"].map(function (k) { return '<button role="tab" data-fid="tt-' + k + '" data-act="ttab" data-k="' + k + '" aria-selected="' + (tab === k) + '">' + esc(t.tabs[k]) + '</button>'; }).join("") + '</div>';
  if (tab === "plan") h += '<ul class="list">' + plan().map(function (p) { return '<li class="item' + (p[2] ? " done" : "") + '"><span class="t">' + p[0] + '</span><span class="n" style="flex:1">' + esc(p[1]) + '</span><span class="pill">' + esc(T.steps[p[3]]) + '</span></li>'; }).join("") + '</ul>';
  if (tab === "prio") h += '<h3>' + esc(t.prio) + '</h3><ul class="list">' + ["p1", "p2", "p3"].map(function (k) { return '<li class="item' + (D.prio[k] ? " done" : "") + '"><button class="chk" data-fid="chk-' + k + '" role="checkbox" aria-checked="' + D.prio[k] + '" aria-label="' + esc(t[k]) + '" data-act="prio" data-k="' + k + '">' + (D.prio[k] ? "✓" : "") + '</button><span class="n">' + esc(t[k]) + '</span></li>'; }).join("") + '</ul><p class="status" role="status">' + esc(f(t.done, { a: pd, b: 3 })) + '</p>';
  if (tab === "recap") h += '<div class="kpi"><div><span>' + esc(t.spent) + '</span><b>' + money(spent) + '</b></div><div><span>' + esc(t.meals) + '</span><b>' + (2 + D.meals.length) + '</b></div><div><span>' + esc(D.workout ? t.workoutLogged : t.workoutNo) + '</span><b>' + (D.workout ? "✓" : "–") + '</b></div></div><p class="status">' + esc(f(t.done, { a: pd, b: 3 })) + '</p>';
  $("#todayui").innerHTML = h + '</div>';
}
function secTrain() {
  return head("train", '<h2>' + esc(T.train.h) + '</h2><p class="lead">' + esc(T.train.lead) + '</p>') + '<div class="cols"><div class="stage" id="trainui"></div><div>' + task("t_train", T.train.task) + SAMPLE + '<div class="card" style="margin-top:16px">' + fbw("train", true) + '</div></div></div>';
}
function renderTrain() {
  var t = T.train, on = [0, 2, 1 + 0].map(function (x) { return x; }), days = t.days, done = 2 + (D.workout ? 1 : 0);
  var h = '<div class="app"><div class="apphead"><h3>' + esc(t.week) + '</h3><span class="badge">' + esc(f(t.goal, { n: D.goal })) + ' · ' + done + '/' + D.goal + '</span></div><div class="week">' + days.map(function (d, i) { var o = i === 0 || i === 2 || (i === 1 && D.workout); return '<span>' + d + '<i class="' + (o ? "on" : "") + '"></i></span>'; }).join("") + '</div>';
  h += '<div class="sheet"><h3>' + esc(t.log) + '</h3><div class="fields"><div class="field"><label for="tex">' + esc(t.ex) + '</label><select id="tex" data-fid="tex">' + [1, 2, 3].map(function (i) { return '<option value="' + i + '">' + esc(t["ex" + i]) + '</option>'; }).join("") + '</select></div><div class="field"><label for="tse">' + esc(t.sets) + '</label><input id="tse" type="number" min="1" max="10" value="3"></div><div class="field"><label for="tre">' + esc(t.reps) + '</label><input id="tre" type="number" min="1" max="30" value="8"></div><div class="field"><label for="tkg">' + esc(t.kg) + '</label><input id="tkg" type="number" min="0" max="300" value="40"></div></div><button class="btn primary" data-fid="tsave" data-act="tsave">' + esc(t.save) + '</button><p class="ok-note" role="status">' + (D.lastSaved ? esc(t.savedMsg) : "") + '</p></div>';
  h += '<h3>' + esc(t.history) + '</h3>' + (D.workouts.length ? '<ul class="list">' + D.workouts.map(function (w) { return '<li class="item"><span class="n" style="flex:1">' + esc(w) + '</span></li>'; }).join("") + '</ul>' : '<p class="samplenote">' + esc(t.none) + '</p>');
  $("#trainui").innerHTML = h + '</div>';
}
function secFood() {
  return head("food", '<h2>' + esc(T.food.h) + '</h2><p class="lead">' + esc(T.food.lead) + '</p>') + '<div class="cols"><div class="stage" id="foodui"></div><div>' + task("t_food", T.food.task) + SAMPLE + '<div class="card" style="margin-top:16px">' + fbw("food", true) + '</div></div></div>';
}
function renderFood() {
  var t = T.food, h = '<div class="app"><h3>' + esc(t.plan) + '</h3><ul class="list">' + MEALS.map(function (m) { var a = D.meals.indexOf(m[0]) >= 0; return '<li class="item"><span class="n" style="flex:1">' + esc(t[m[0]]) + '<br><small style="color:var(--text-2)">' + m[2] + ' ' + esc(t.time) + '</small></span><button class="btn' + (a ? "" : " primary") + '" data-fid="meal-' + m[0] + '" data-act="meal" data-m="' + m[0] + '" aria-pressed="' + a + '">' + esc(a ? t.added : t.add) + '</button></li>'; }).join("") + '</ul><h3>' + esc(t.groceries) + '</h3>';
  h += D.meals.length ? '<ul class="list">' + D.meals.map(function (k) { var m = MEALS.filter(function (x) { return x[0] === k; })[0]; return '<li class="item"><span class="n">' + esc(t[m[1]]) + '</span></li>'; }).join("") + '</ul>' : '<p class="samplenote">' + esc(t.empty) + '</p>';
  $("#foodui").innerHTML = h + '</div>';
}
function secMoney() {
  return head("money", '<h2>' + esc(T.money.h) + '</h2><p class="lead">' + esc(T.money.lead) + '</p>') + '<div class="cols"><div class="stage" id="moneyui"></div><div>' + task("t_money", T.money.task) + SAMPLE + '<p class="samplenote">' + esc(T.money.manual) + '</p><div class="card" style="margin-top:16px">' + fbw("money", true) + '</div></div></div>';
}
function catSpent(c) { return BASE[c][0] + D.expenses.filter(function (e) { return e.c === c && e.n !== "coffee"; }).reduce(function (s, e) { return s + e.a; }, 0); }
function renderMoney() {
  var t = T.money, h = '<div class="app"><div class="apphead"><h3>' + esc(t.month) + '</h3></div><p class="samplenote" style="margin:0">' + esc(t.tapHint) + '</p><div class="bars">';
  Object.keys(BASE).forEach(function (c) {
    var sp = catSpent(c), cap = BASE[c][1], open = D.open === c;
    h += '<div><button class="bar" data-fid="cat-' + c + '" data-act="cat" data-c="' + c + '" aria-expanded="' + open + '"><span class="top2"><span>' + esc(t.cats[c]) + '</span><span>' + money(sp) + ' ' + esc(t.of) + ' ' + money(cap) + '</span></span><span class="track"><i style="width:' + Math.min(100, sp / cap * 100) + '%"></i></span><small style="color:var(--text-2)">' + money(Math.max(0, cap - sp)) + ' ' + esc(t.left) + '</small></button>';
    if (open) h += '<ul class="list" style="margin-top:8px">' + TX[c].map(function (x) { return '<li class="item"><span class="n" style="flex:1">' + esc(x[0]) + '</span><b>' + money(x[1]) + '</b></li>'; }).concat(D.expenses.filter(function (e) { return e.c === c && e.n === "new"; }).map(function (e) { return '<li class="item"><span class="n" style="flex:1">+ ' + esc(t.add) + '</span><b>' + money(e.a) + '</b></li>'; })).join("") + '</ul>';
    h += '</div>';
  });
  h += '</div><div class="sheet"><h3>' + esc(t.add) + '</h3><div class="fields"><div class="field"><label for="mamt">' + esc(t.amount) + '</label><input id="mamt" type="number" min="1" value="' + Math.round(12 * T._rate) + '"></div><div class="field"><label for="mcat">' + esc(t.cat) + '</label><select id="mcat">' + Object.keys(BASE).map(function (c) { return '<option value="' + c + '">' + esc(t.cats[c]) + '</option>'; }).join("") + '</select></div></div><button class="btn primary" data-fid="madd" data-act="madd">' + esc(t.addBtn) + '</button></div></div>';
  $("#moneyui").innerHTML = h;
}
function secCircle() {
  return head("circle", '<h2>' + esc(T.circle.h) + '</h2><p class="lead">' + esc(T.circle.lead) + '</p>') + '<div class="cols"><div class="stage" id="circleui"></div><div>' + task("t_circle", T.circle.task) + SAMPLE + '<div class="card" style="margin-top:16px">' + fbw("circle", true) + '</div></div></div>';
}
function renderCircle() {
  var t = T.circle, cols = { sam: "#2563eb", mom: "#0f7a4a", dee: "#8a5a00" }, ar = ["today", "train", "food", "money"];
  var h = '<div class="app"><p class="samplenote" style="margin:0">' + esc(t.tip) + '</p><div class="list">' + ["sam", "mom", "dee"].map(function (p) { return '<button class="person" data-fid="pp-' + p + '" data-act="person" data-p="' + p + '" aria-pressed="' + (D.person === p) + '"><span class="ava" style="background:' + cols[p] + '" aria-hidden="true">' + esc(t.people[p].charAt(0)) + '</span><span><b>' + esc(t.people[p]) + '</b></span></button>'; }).join("") + '</div>';
  var P = D.person, vis = ar.filter(function (a) { return D.perm[P][a]; });
  h += '<h3>' + esc(f(t.sees, { who: t.people[P].split(" ")[0] })) + '</h3>' + ar.map(function (a) { return '<div class="switch"><span id="lb-' + a + '">' + esc(t.areas[a]) + ' <small style="color:var(--text-2)">· ' + esc(D.perm[P][a] ? t.on : t.off) + '</small></span><button class="sw" data-fid="sw-' + a + '" role="switch" aria-checked="' + !!D.perm[P][a] + '" aria-labelledby="lb-' + a + '" data-act="perm" data-a="' + a + '"></button></div>'; }).join("");
  h += '<h3>' + esc(t.preview) + '</h3><div class="preview">' + (vis.length ? '<ul class="list">' + vis.map(function (a) { return '<li class="item"><span class="n">' + esc(t.areas[a]) + '</span></li>'; }).join("") + '</ul>' : '<span class="samplenote">' + esc(t.previewEmpty) + '</span>') + '</div></div>';
  $("#circleui").innerHTML = h;
}
/* ---------- avatars (real Kit 9 engine) ---------- */
function secAv() {
  return head("avatars", '<h2>' + esc(T.av.h) + '</h2><p class="lead">' + esc(T.av.lead) + '</p>') + '<div class="cols" style="grid-template-columns:minmax(0,1fr)"><div class="stage" id="avui"></div><div>' + task("t_avatar", T.av.task) + '<div class="card" style="margin-top:16px">' + fbw("avatars", true) + '</div></div></div>';
}
var AVTOK = 0;
function avInit() { var K = window.RVKit; if (!K) { $("#avui").innerHTML = '<p role="alert">' + esc(T.av.loadFail) + '</p>'; return; } D.av = { origin: "vela", state: JSON.parse(JSON.stringify(K.KIT_PRESET_STATE.vela)), touched: false }; renderAv(); drawAv(); }
function renderAv() {
  var K = window.RVKit, A = D.av, a = T.av, base = "../assets/avatars/exports/128/";
  var h = '<div class="avwrap"><div><img class="avimg" id="avimg" alt="" width="200" height="200"><p class="status" id="avst" role="status"></p><button class="btn" data-act="avreset" style="width:100%">' + esc(a.reset) + '</button></div><div class="cats"><div><h3>' + esc(a.looks) + '</h3><div class="looks">' + K.AVATAR_PRESET_IDS.map(function (id) { return '<button class="look" data-fid="look-' + id + '" data-act="look" data-id="' + id + '" aria-pressed="' + (A.origin === id) + '" aria-label="' + esc(K.AVATAR_PRESET_NAMES[id]) + '"><img src="' + base + id + '.png" alt="" width="64" height="64"></button>'; }).join("") + '</div></div><h3 style="margin:0">' + esc(a.path1) + '</h3>';
  K.KIT_CATEGORIES.forEach(function (c) {
    var pal = c === "skin" || c === "hairColor" || c === "eyeColor", key = c, val = A.state[key];
    h += '<div><h3 id="cl-' + c + '">' + esc(a.cat[c]) + '</h3><div class="sw-row" role="group" aria-labelledby="cl-' + c + '">' + K.KIT_OPTIONS[c === "eyeColor" ? "eyeColor" : c].map(function (o) { return pal ? '<button class="swatch" data-fid="o-' + c + '-' + o.id + '" data-act="opt" data-c="' + c + '" data-v="' + o.id + '" style="background:' + o.hex + '" aria-pressed="' + (val === o.id) + '" aria-label="' + esc(o.name) + '" title="' + esc(o.name) + '"></button>' : '<button class="opt" data-fid="o-' + c + '-' + o.id + '" data-act="opt" data-c="' + c + '" data-v="' + o.id + '" aria-pressed="' + (val === o.id) + '">' + esc(o.name) + '</button>'; }).join("") + '</div></div>';
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
    pres.innerHTML = '<h3>' + esc(T.av.closest) + '</h3><div class="closest">' + ids.map(function (id) { return '<button class="look" data-fid="cl3-' + id + '" data-act="pick" data-id="' + id + '" aria-label="' + esc(K.AVATAR_PRESET_NAMES[id]) + '"><img src="../assets/avatars/exports/128/' + id + '.png" alt=""></button>'; }).join("") + '</div><p class="samplenote">' + esc(T.av.photoNote) + '</p>';
  });
  S.photo = "tried"; save();
}
/* ---------- support, concepts, final ---------- */
function secSup() {
  var s = T.sup;
  return head("support", '<h2>' + esc(s.h) + '</h2><p class="lead">' + esc(s.lead) + '</p>') + '<div class="sup" style="margin-top:24px">' +
    [["rec", s.rec, s.recT, s.recB, '<div class="kpi"><div><span>' + esc(s.sleep) + '</span><b>' + s.hrs + '</b></div></div><p>' + esc(s.rest) + '</p>'], ["hea", s.hea, s.heaT, s.heaB, '<p class="item" style="margin:0">' + esc(s.rem) + '</p>'], ["cal", s.cal, s.calT, s.calB, '<p class="item" style="margin:0"><span class="t">19:30</span> ' + esc(s.ev) + '</p>']].map(function (x) { return '<div class="card"><span class="badge">' + esc(x[1]) + '</span><h3 style="margin-top:8px">' + esc(x[2]) + '</h3><p class="lead" style="font-size:.95rem">' + esc(x[3]) + '</p>' + x[4] + '</div>'; }).join("") + '</div>' + SAMPLE + '<div class="card" style="margin-top:16px;max-width:760px">' + fbw("support", false) + '</div>';
}
function secCon() {
  var c = T.con;
  return head("concepts", '<h2>' + esc(c.h) + '</h2><p class="lead">' + esc(c.lead) + '</p><p><span class="badge concept">' + esc(c.rule) + '</span></p>') + '<div class="concepts" style="margin-top:20px">' + CONCEPTS.map(function (k) {
    var cur = S.concepts[k] || {};
    return '<div class="card concept"><span class="badge concept">' + esc(c.tag) + '</span><h3>' + esc(c[k][0]) + '</h3><p style="margin:0;color:var(--text-2)">' + esc(c[k][1]) + '</p><div class="seg" role="group" aria-label="' + esc(T.q_useful) + '">' + ["yes", "no", "unsure"].map(function (v) { return '<button type="button" data-act="cf" data-s="' + k + '" data-v="' + v + '" aria-pressed="' + (cur.useful === v) + '">' + esc(T[v]) + '</button>'; }).join("") + '</div><textarea data-act="cnote" data-s="' + k + '" placeholder="' + esc(T.notePh) + '" aria-label="' + esc(T.notePh + " — " + c[k][0]) + '" maxlength="500">' + esc(cur.note || "") + '</textarea></div>';
  }).join("") + '</div>';
}
function secFinal() {
  var q = T.fin, F = S.final || {};
  function ta(k) { return '<div class="field"><label for="f-' + k + '">' + esc(q[k]) + ' <span class="badge">' + esc(T.optional) + '</span></label><textarea id="f-' + k + '" data-act="fin" data-k="' + k + '" maxlength="800">' + esc(F[k] || "") + '</textarea></div>'; }
  return head("final", '<h2>' + esc(q.h) + '</h2><p class="lead">' + esc(q.lead) + '</p>') + '<div class="card final" style="max-width:760px;display:grid;gap:14px"><p class="status" id="fprog"></p>' + ta("best") + ta("confusing") + ta("remove") + ta("missing") + '<div><h3>' + esc(q.use) + '</h3><div class="seg" role="group" aria-label="' + esc(q.use) + '">' + ["yes", "no", "unsure"].map(function (v) { return '<button type="button" data-act="fuse" data-v="' + v + '" aria-pressed="' + (F.use === v) + '">' + esc(T[v]) + '</button>'; }).join("") + '</div></div>' + ta("why") +
    '<div class="row"><button class="btn primary" id="send" data-act="send">' + esc(S.complete ? q.resend : q.send) + '</button><button class="btn ghost" data-act="del">' + esc(q.del) + '</button></div><div id="fout" role="status" aria-live="polite"></div></div>';
}

/* ---------- mount ---------- */
var sections = { landing: secLanding, onboarding: secOnb, today: secToday, train: secTrain, food: secFood, money: secMoney, circle: secCircle, avatars: secAv, support: secSup, concepts: secCon, final: secFinal };
function mount() {
  STEPS.forEach(function (id) { var el = document.getElementById(id); el.innerHTML = id === "landing" ? sections[id]() : '<div class="wrap">' + sections[id]() + '</div>'; });
  $("#stepper").innerHTML = STEPS.map(function (id) { return '<a href="#' + id + '" data-step="' + id + '">' + esc(T.steps[id]) + '</a>'; }).join("");
  renderWeb(); renderOnb(); renderToday(); renderTrain(); renderFood(); renderMoney(); renderCircle(); avInit(); TASKS.forEach(refreshTask); refreshFinal(); paintReached();
}
function renderAll() {
  var a = document.activeElement, fid = a && a.dataset && a.dataset.fid, sel = a && a.id;
  renderToday(); renderTrain(); renderFood(); renderMoney(); renderCircle();
  if (fid) { var n = $('[data-fid="' + fid + '"]'); if (n) n.focus(); }
}
function refreshFinal() { var p = $("#fprog"); if (p) p.textContent = f(T.fin.progress, { n: S.reached.length, t: STEPS.length }); }
function paintReached() { $$("#stepper a").forEach(function (a) { a.classList.toggle("reached", S.reached.indexOf(a.dataset.step) >= 0); }); refreshFinal(); }
function ensureFb(id) { return S.fb[id] || (S.fb[id] = {}); }

/* ---------- events ---------- */
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]"); if (!b) return; var act = b.dataset.act;
  if (act === "fb") { var o = ensureFb(b.dataset.s), k = b.dataset.k; o[k] = o[k] === b.dataset.v ? null : b.dataset.v; $$('[data-s="' + b.dataset.s + '"][data-k="' + k + '"]').forEach(function (x) { x.setAttribute("aria-pressed", String(o[k] === x.dataset.v)); }); save(); }
  else if (act === "cf") { var c = S.concepts[b.dataset.s] || (S.concepts[b.dataset.s] = {}); c.useful = c.useful === b.dataset.v ? null : b.dataset.v; $$('[data-act="cf"][data-s="' + b.dataset.s + '"]').forEach(function (x) { x.setAttribute("aria-pressed", String(c.useful === x.dataset.v)); }); save(); }
  else if (act === "fuse") { S.final.use = S.final.use === b.dataset.v ? null : b.dataset.v; $$('[data-act="fuse"]').forEach(function (x) { x.setAttribute("aria-pressed", String(S.final.use === x.dataset.v)); }); save(); }
  else if (act === "tstuck" || act === "tskip") { var id = b.dataset.t; S.tasks[id] = { done: act === "tstuck" ? "stuck" : "skipped", ms: Date.now() - (taskStart[id] || T0) }; refreshTask(id); save(); }
  else if (act === "webmove") { D.moved = !D.moved; renderWeb(); renderAll(); }
  else if (act === "oba") { var a = b.dataset.a, i = D.areas.indexOf(a); if (i >= 0) D.areas.splice(i, 1); else D.areas.push(a); renderOnb(); $('[data-a="' + a + '"]').focus(); }
  else if (act === "obc") { D.circleMode = b.dataset.m; renderOnb(); $('[data-m="' + b.dataset.m + '"]').focus(); }
  else if (act === "obn") { if (ob.n === 1) D.name = ($("#obname").value || "").trim().slice(0, 24); if (ob.n === 2) D.goal = +$("#obgoal").value; if (ob.n < 3) ob.n++; else { D.obDone = true; } renderOnb(); renderAll(); var nb = $('[data-act="obn"]'); nb && nb.focus(); }
  else if (act === "obb") { ob.n = Math.max(0, ob.n - 1); renderOnb(); }
  else if (act === "ttab") { D.tab = b.dataset.k; renderToday(); $('[data-fid="tt-' + D.tab + '"]').focus(); }
  else if (act === "prio") { var k2 = b.dataset.k; D.prio[k2] = !D.prio[k2]; if (k2 === "p2") D.workout = D.prio.p2 || D.workout; renderAll(); completeTask("t_today"); }
  else if (act === "tsave") { var ex = $("#tex"), nm = ex.options[ex.selectedIndex].text; D.workout = true; D.prio.p2 = true; D.lastSaved = true; D.workouts.unshift(nm + " · " + $("#tse").value + " × " + $("#tre").value + " · " + $("#tkg").value + " kg"); renderAll(); completeTask("t_train"); }
  else if (act === "meal") { var m = b.dataset.m, j = D.meals.indexOf(m); if (j < 0) D.meals.push(m); else D.meals.splice(j, 1); renderAll(); if (j < 0) completeTask("t_food"); }
  else if (act === "cat") { var cc = b.dataset.c; D.open = D.open === cc ? null : cc; renderAll(); if (D.open) completeTask("t_money"); }
  else if (act === "madd") { var amt = Math.max(1, +$("#mamt").value || 0) / T._rate; D.expenses.push({ c: $("#mcat").value, a: amt, n: "new" }); renderAll(); }
  else if (act === "person") { D.person = b.dataset.p; renderCircle(); $('[data-fid="pp-' + D.person + '"]').focus(); }
  else if (act === "perm") { var ar = b.dataset.a; D.perm[D.person][ar] = !D.perm[D.person][ar]; renderCircle(); $('[data-fid="sw-' + ar + '"]').focus(); completeTask("t_circle"); }
  else if (act === "look") { var K = window.RVKit; D.av.origin = b.dataset.id; D.av.state = JSON.parse(JSON.stringify(K.KIT_PRESET_STATE[b.dataset.id])); renderAv(); drawAv(); $('[data-fid="look-' + b.dataset.id + '"]').focus(); completeTask("t_avatar"); }
  else if (act === "opt") { D.av.state[b.dataset.c] = b.dataset.v; renderAv(); drawAv(); $('[data-fid="o-' + b.dataset.c + "-" + b.dataset.v + '"]').focus(); completeTask("t_avatar"); }
  else if (act === "avreset") { var K2 = window.RVKit; D.av.state = JSON.parse(JSON.stringify(K2.KIT_PRESET_STATE[D.av.origin])); renderAv(); drawAv(); }
  else if (act === "pick") { var K3 = window.RVKit, id3 = b.dataset.id; D.av.origin = id3; D.av.state = JSON.parse(JSON.stringify(K3.KIT_PRESET_STATE[id3])); if (D.photoPick) { if (D.photoPick.skin) D.av.state.skin = D.photoPick.skin; if (D.photoPick.hair) D.av.state.hairColor = D.photoPick.hair; } renderAv(); drawAv(); completeTask("t_avatar"); $("#avimg").scrollIntoView({ block: "nearest" }); }
  else if (act === "cam") { camStart(); }
  else if (act === "snap") { var v = $("#camvid"); var cv = document.createElement("canvas"); cv.width = v.videoWidth; cv.height = v.videoHeight; cv.getContext("2d").drawImage(v, 0, 0); stopCam(); handlePhoto(cv, cv.width, cv.height); cv.width = cv.height = 0; }
  else if (act === "camcancel") { stopCam(); }
  else if (act === "send") { sendFinal(); }
  else if (act === "del") { delAll(); }
  else if (act === "priv") { $("#privdlg").showModal(); }
  else if (act === "retry") { flush(); }
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
  var t = e.target, act = t.dataset && t.dataset.act;
  if (act === "note") { ensureFb(t.dataset.s).note = t.value.slice(0, 500); save(); }
  if (act === "cnote") { (S.concepts[t.dataset.s] || (S.concepts[t.dataset.s] = {})).note = t.value.slice(0, 500); save(); }
  if (act === "fin") { S.final[t.dataset.k] = t.value.slice(0, 800); save(); }
  if (t.id === "obgoal") $("#obgv").textContent = t.value;
});
function camStart() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(function (st) {
    D.stream = st; $("#camwrap").innerHTML = '<video id="camvid" playsinline muted></video><div class="row" style="margin-top:8px"><button class="btn primary" data-act="snap">' + esc(T.av.take) + '</button><button class="btn" data-act="camcancel">' + esc(T.av.cancel) + '</button></div>'; var v = $("#camvid"); v.srcObject = st; v.play();
  }).catch(function () { $("#pres").innerHTML = '<p>' + esc(T.av.noFace) + '</p>'; });
}
function sendFinal() {
  var b = $("#send"), out = $("#fout"); if (b.disabled) return; b.disabled = true; b.textContent = T.fin.sending; out.textContent = "";
  S.complete = true; dirty = true; ls("rv.draft", JSON.stringify(S)); clearTimeout(timer);
  (function go() { if (inflight) { return setTimeout(go, 200); } var p = flush(); (p && p.then ? p : Promise.resolve(false)).then(function (ok) {
    if (ok && !dirty) { out.innerHTML = '<div class="thanks"><b>' + esc(T.fin.thanks) + '</b><p>' + esc(T.fin.thanksBody) + '</p><p class="samplenote">' + esc(T.fin.ref) + ': <code>' + esc(S.sid.slice(0, 8)) + '</code></p></div>'; b.textContent = T.fin.resend; b.disabled = false; ls("rv.draft", JSON.stringify(S)); }
    else { S.complete = true; out.innerHTML = '<p role="alert" style="color:var(--bad)"><b>' + esc(T.fin.err) + '</b></p>'; b.textContent = T.fin.send; b.disabled = false; }
  }); })();
}
function delAll() {
  if (!confirm(T.fin.delAsk)) return;
  fetch(DEL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sid: S.sid }) }).then(function (r) { return r.json(); }).then(function (j) {
    if (j.ok) { ls("rv.draft", null); ls("rv.sid", null); S = { sid: rid(), reached: [], fb: {}, tasks: {}, concepts: {}, final: {}, photo: "none", complete: false }; ls("rv.sid", S.sid); dirty = false; $("#fout").textContent = T.fin.delOk; setStatus(""); }
  }).catch(function () { $("#fout").textContent = T.fin.err; });
}
/* reached = a section stayed at least 40% visible for 1 s */
if ("IntersectionObserver" in window) {
  var timers = {}, cur = null;
  var io = new IntersectionObserver(function (es) { es.forEach(function (en) {
    var id = en.target.id;
    if (en.isIntersecting) {
      $$("#stepper a").forEach(function (a) { a.classList.toggle("on", a.dataset.step === id); });
      TASKS.forEach(function (t) { if (en.target.querySelector('[data-task="' + t + '"]') && !taskStart[t]) taskStart[t] = Date.now(); });
      timers[id] = setTimeout(function () { if (S.reached.indexOf(id) < 0) { S.reached.push(id); paintReached(); save(); } }, 1000);
    } else clearTimeout(timers[id]);
  }); }, { threshold: 0.35 });
  STEPS.forEach(function (id) { io.observe(document.getElementById(id)); });
}
/* language links keep the hash/query */
$$("[data-lang-link]").forEach(function (a) { a.href = "../" + a.dataset.langLink + "/" + location.search + location.hash; });
document.title = "RYVANO · " + T.hero.eyebrow;
$("#banner").textContent = T.reviewBanner; $("#privbtn").textContent = T.privacyLink; $("#foot").textContent = T.foot;
$("#privdlg").innerHTML = '<h2 style="font-size:1.4rem">' + esc(T.priv.h) + '</h2><ul>' + T.priv.b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul><form method="dialog"><button class="btn primary">' + esc(T.priv.close) + '</button></form>';
$("#retry").textContent = T.retry; $("#skiplink").textContent = T.skip; $("#langlabel").textContent = T.langLabel; $("#stepper").setAttribute("aria-label", T.progress);
if (QA) { var q = document.createElement("span"); q.className = "badge concept"; q.textContent = "QA"; $(".top .sp").after(q); }
mount();
window.__rv = { S: function () { return S; }, flush: flush, D: D, T: T };
})();
