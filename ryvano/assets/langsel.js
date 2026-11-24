/* Canonical language selector for the whole review system (portal, RYVANO, Chase). One markup, one interaction pattern, product colours via --ls-* tokens.
   LangSel.open({ title, placeholder, closeLabel, none, items:[{code,n,s,lang,rtl}], current, uiLocale, onPick }) */
(function () {
"use strict";
function fold(x) { return String(x == null ? "" : x).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
var D = null, O = null, rows = [], act = 0, closing = false;
var CHECK = '<svg class="ls-ck" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
var CLOSE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function build() {
  D = document.createElement("dialog"); D.className = "lsd"; D.setAttribute("aria-labelledby", "ls-title");
  D.innerHTML = '<div class="ls-grab" aria-hidden="true"></div><div class="ls-head"><h2 id="ls-title"></h2><button class="ls-x" type="button"></button></div><div class="ls-search"><input id="ls-q" type="search" role="combobox" aria-expanded="true" aria-controls="ls-list" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></div><ul id="ls-list" role="listbox" tabindex="-1"></ul>';
  document.body.appendChild(D);
  D.querySelector(".ls-x").innerHTML = CLOSE; D.querySelector(".ls-x").addEventListener("click", close);
  D.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
  D.addEventListener("click", function (e) { if (e.target === D) close(); });
  var q = D.querySelector("#ls-q"), ul = D.querySelector("#ls-list");
  q.addEventListener("input", function () { act = 0; paint(); });
  q.addEventListener("keydown", function (e) {
    var n = rows.length;
    if (e.key === "ArrowDown") { e.preventDefault(); act = Math.min(n - 1, act + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); act = Math.max(0, act - 1); mark(); }
    else if (e.key === "Home") { e.preventDefault(); act = 0; mark(); }
    else if (e.key === "End") { e.preventDefault(); act = Math.max(0, n - 1); mark(); }
    else if (e.key === "Enter") { e.preventDefault(); if (rows[act]) pick(rows[act].code); }
  });
  ul.addEventListener("click", function (e) { var li = e.target.closest("li[data-c]"); if (li) pick(li.dataset.c); });
}
function pick(code) { var cb = O && O.onPick; close(function () { if (cb) cb(code); }); }
function close(cb) {
  if (!D || !D.open) { if (typeof cb === "function") cb(); return; }
  var done = function () { D.classList.remove("ls-out"); if (D.open) D.close(); if (typeof cb === "function") cb(); };
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
  D.classList.add("ls-out"); setTimeout(done, 180);
}
function paint() {
  var q = fold(D.querySelector("#ls-q").value.trim()), ul = D.querySelector("#ls-list");
  rows = O.items.filter(function (it) { return !q || it._k.indexOf(q) >= 0; });
  if (act >= rows.length) act = 0;
  ul.innerHTML = rows.length ? rows.map(function (it, i) {
    var sec = it.s && fold(it.s) !== fold(it.n) ? '<span class="ls-s">' + esc(it.s) + '</span>' : "";
    return '<li role="option" id="ls-o-' + i + '" data-c="' + esc(it.code) + '" aria-selected="' + (it.code === O.current) + '" class="ls-row' + (i === act ? " act" : "") + '"><span class="ls-t"><span class="ls-n" lang="' + esc(it.lang || it.code) + '"' + '>' + esc(it.n) + '</span>' + sec + '</span>' + CHECK + '</li>';
  }).join("") : '<li class="ls-none" role="presentation">' + esc(O.none || "—") + '</li>';
  mark();
}
function mark() {
  var ul = D.querySelector("#ls-list"), q = D.querySelector("#ls-q");
  Array.prototype.forEach.call(ul.querySelectorAll(".ls-row"), function (li, i) { li.classList.toggle("act", i === act); });
  var li = ul.querySelector("#ls-o-" + act); q.setAttribute("aria-activedescendant", li ? li.id : "");
  if (li && li.scrollIntoView) li.scrollIntoView({ block: "nearest" });
}
function open(o) {
  if (!D) build();
  O = o; closing = false; var dn = null;
  try { dn = new Intl.DisplayNames([o.uiLocale || document.documentElement.lang || "en"], { type: "language" }); } catch (e) { }
  O.items = o.items.map(function (it) { var al = ""; try { al = dn ? (dn.of(it.lang || it.code) || "") : ""; } catch (e) { } return Object.assign({}, it, { _k: fold([it.n, it.s, al, it.code].join(" ")) }); });
  D.setAttribute("dir", document.documentElement.dir || "ltr");
  D.querySelector("#ls-title").textContent = o.title || ""; D.querySelector(".ls-x").setAttribute("aria-label", o.closeLabel || "Close");
  var q = D.querySelector("#ls-q"); q.value = ""; q.placeholder = o.placeholder || ""; q.setAttribute("aria-label", o.placeholder || o.title || "");
  act = Math.max(0, O.items.map(function (it) { return it.code; }).indexOf(o.current)); paint();
  if (!D.open) D.showModal();
  var sel = D.querySelector('.ls-row[aria-selected="true"]'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "center" });
  if (!(window.matchMedia && matchMedia("(pointer: coarse)").matches)) q.focus(); /* on touch screens the keyboard stays hidden until the search field is tapped */
}
window.LangSel = { open: open, close: close };
})();
