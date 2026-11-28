// Satta7 web host (รอบ 82 · รอบ 88 แถบเครดิตในหัวเมนู · รอบ 92 ปุ่มอัปเดตแอป · รอบ 98 ShareSheet แชร์สรุป) · ให้ satta7.js รุ่นเดียวกับ iPhone ทำงานบนเบราว์เซอร์ Android / PWA โดยไม่แก้ไฟล์แอป
// แทนของ Scriptable 6 อย่าง: FileManager (→ localStorage) · WebView (→ iframe) · Alert (→ กล่อง HTML) · Script · Timer · ShareSheet (→ navigator.share / คัดลอก · รอบ 98)
// ส่วนที่แตะ DOM อยู่ใน adapter (ฝั่งเบราว์เซอร์อยู่ท้ายไฟล์) · ชุดตรวจ host_test.js ใช้ adapter จำลองใน Node
(function (G) {
  "use strict";
  const KEY = "s7fs:", DKEY = "s7dir:";

  // ---------- ลิงก์กลับของแต่ละหน้า (ปุ่มย้อนกลับของ Android) ----------
  // ใช้ปุ่มหลักของแถบล่าง (class "bb pri") ก่อน: up · xup · back · ถ้าไม่มี ใช้ xup/back/cancel ตัวแรกในหน้า
  function backTarget(html) {
    const s = String(html || "");
    const m = /<a class="bb pri" href="(satta7:\/\/(?:up|xup|back|cancel)[^"]*)"/.exec(s)
      || /href="(satta7:\/\/(?:xup|back|cancel)[^"]*)"/.exec(s);
    return m ? m[1].replace(/&amp;/g, "&") : null;
  }
  // หน้าแบบฟอร์มสั่งบันทึกด้วย location.href="satta7://…" · iframe เปิดสคีมนี้ไม่ได้ จึงเปลี่ยนเป็นตัวรับของ host
  function rewritePage(html) {
    return String(html).replace(/location\.href\s*=\s*(?=["'`]satta7:\/\/)/g, "__s7loc=");
  }

  function createHost(A) {   // A = adapter: store · render(html) · evalPage(code) · dialog({title,message,actions,cancel}) · onBoot
    const st = A.store;
    // ---------- FileManager ----------
    const fmObj = {
      documentsDirectory: () => "/Documents",
      joinPath: (a, b) => String(a).replace(/\/+$/, "") + "/" + String(b).replace(/^\/+/, ""),
      fileExists: p => st.getItem(KEY + p) !== null || st.getItem(DKEY + p) !== null,
      isDirectory: p => st.getItem(DKEY + p) !== null,
      createDirectory: p => { st.setItem(DKEY + p, "1"); },
      readString: p => { const v = st.getItem(KEY + p); return v === null ? null : v; },
      writeString: (p, s) => { st.setItem(KEY + p, String(s)); },
      copy: (a, b) => { const v = st.getItem(KEY + a); if (v !== null) st.setItem(KEY + b, v); },
      remove: p => { st.removeItem(KEY + p); st.removeItem(DKEY + p); },
    };
    const FileManager = { local: () => fmObj, iCloud: () => fmObj };
    // ---------- Timer / Script ----------
    const Timer = { schedule: (ms, repeat, fn) => { const id = repeat ? setInterval(fn, ms) : setTimeout(fn, ms); return { invalidate: () => (repeat ? clearInterval(id) : clearTimeout(id)) }; } };
    const Script = { complete: () => {}, name: () => "Satta7" };
    // ---------- Alert ----------
    // แอปเรียง addAction ก่อน addCancelAction · present() คืนเลขปุ่ม (0, 1, …) · ปุ่มยกเลิกคืน -1 (เหมือน Scriptable)
    // เมนู "🔮 …" ต่อท้ายด้วยปุ่มของ host (ส่งออก/นำเข้าดวง · รอบ 92 อัปเดตแอป) · แอปได้ -1 จึงไม่ทำอะไร
    class Alert {
      constructor() { this.title = ""; this.message = ""; this._a = []; this._c = null; }
      addAction(t) { this._a.push(String(t)); }
      addDestructiveAction(t) { this._a.push(String(t)); }
      addCancelAction(t) { this._c = String(t); }
      async present() {
        const extra = /^🔮/.test(this.title) ? HOST_MENU.map(x => x.label) : [];
        bump(); const i = await A.dialog({ title: this.title, message: this.message, actions: this._a.concat(extra), cancel: this._c });
        if (i >= this._a.length) { await HOST_MENU[i - this._a.length].run(); return -1; }
        return i;
      }
      presentAlert() { return this.present(); }
      presentSheet() { return this.present(); }
    }
    // ---------- ShareSheet (รอบ 98 ข้อตัดสิน 144-2) ----------
    // แอปส่งอาร์เรย์ข้อความ · adapter.share(text) คืน "shared" | "copied" | "shown" | "cancel"
    const ShareSheet = { present: async items => {
      const t = (items || []).map(x => String(x)).join("\n"), r = A.share ? await A.share(t) : "none"; bump();
      return { completed: r === "shared" || r === "copied", activity_type: r }; } };
    // ---------- WebView ----------
    let CUR = null, HTML = "", SEQ = 0, waiters = [];
    const bump = () => { SEQ++; const w = waiters; waiters = []; w.forEach(f => f()); };
    // รอหน้าถัดไปหรือกล่องข้อความ (สูงสุด ms) · ใช้กับปุ่มย้อนกลับและชุดตรวจ
    const waitNext = ms => new Promise(res => { const s0 = SEQ; let t = null; const f = () => { if (t) clearTimeout(t); res(SEQ !== s0); }; waiters.push(f); t = setTimeout(() => { waiters = waiters.filter(x => x !== f); res(false); }, ms); });
    class WebView {
      constructor() { this.shouldAllowRequest = null; CUR = this; }
      async loadHTML(html) { HTML = rewritePage(html); await A.render(HTML); bump(); }
      async evaluateJavaScript(code) { return A.evalPage(String(code)); }
      async present() { return new Promise(() => {}); }   // แอปเปิดค้างจนผู้ใช้ปิดแท็บ
    }
    // ---------- นำทาง ----------
    let busy = Promise.resolve();
    function nav(url) {   // ลิงก์ satta7:// ทุกตัวในหน้า และปุ่มย้อนกลับ
      const u = String(url || "");
      if (!CUR || typeof CUR.shouldAllowRequest !== "function" || u.indexOf("satta7://") !== 0) return false;
      CUR.shouldAllowRequest({ url: u });
      return true;
    }
    const back = () => { const t = backTarget(HTML); return t ? nav(t) : false; };
    // ---------- ส่งออก / นำเข้าดวง ----------
    const P = "/Documents/satta7/profiles.json", S = "/Documents/satta7/state.json";
    function exportData() {
      const pr = fmObj.readString(P), sv = fmObj.readString(S);
      return JSON.stringify({ app: "satta7", kind: "profiles", at: new Date().toISOString(), profiles: pr ? JSON.parse(pr) : [], state: sv ? JSON.parse(sv) : {} }, null, 1);
    }
    function importData(text) {   // รับไฟล์ส่งออกของ host หรือ profiles.json จาก iPhone (อาร์เรย์) · รวมตาม id ของใหม่ทับของเดิม
      let o; try { o = JSON.parse(String(text || "").trim()); } catch (e) { return { ok: false, msg: "อ่านข้อมูลไม่ได้ (ไม่ใช่ JSON)" }; }
      const L = Array.isArray(o) ? o : (o && Array.isArray(o.profiles) ? o.profiles : null);
      if (!L) return { ok: false, msg: "ไม่พบรายการดวงในข้อมูลนี้" };
      const good = L.filter(p => p && typeof p === "object" && typeof p.iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.iso));
      if (!good.length) return { ok: false, msg: "ไม่มีดวงที่อ่านได้ (ต้องมีวันเกิดแบบ ปปปป-ดด-วว)" };
      let old = []; try { old = JSON.parse(fmObj.readString(P) || "[]"); } catch (e) { old = []; }
      const ids = new Set(good.map(p => p.id)), merged = good.concat(old.filter(p => !ids.has(p.id)));
      if (!fmObj.isDirectory("/Documents/satta7")) fmObj.createDirectory("/Documents/satta7");
      fmObj.writeString(P, JSON.stringify(merged.slice(0, 30)));
      let sv = {}; try { sv = JSON.parse(fmObj.readString(S) || "{}"); } catch (e) { sv = {}; }
      if (!merged.some(p => p.id === sv.curId)) { sv.curId = merged[0].id; fmObj.writeString(S, JSON.stringify(sv)); }
      return { ok: true, n: good.length, total: Math.min(merged.length, 30), cut: merged.length > 30 };
    }
    const HOST_MENU = [
      { label: "⇪ ส่งออกดวงที่บันทึกไว้", run: async () => { await A.exportFile("satta7_profiles.json", exportData()); } },
      { label: "⇩ นำเข้าดวง (จาก iPhone หรือไฟล์ส่งออก)", run: async () => {
          const t = await A.askImport(); if (t == null) return;
          const r = importData(t);
          await A.dialog({ title: r.ok ? "นำเข้าแล้ว" : "นำเข้าไม่ได้", message: r.ok ? `นำเข้า ${r.n} ดวง · รวมทั้งหมด ${r.total} ดวง${r.cut ? " (เก็บได้สูงสุด ๓๐ ดวง)" : ""}` : r.msg, actions: ["ตกลง"], cancel: null });
          if (r.ok) A.reload(); } },
      // รอบ 92 ข้อ 122: ล้างแคชของแอปแล้วโหลดรุ่นล่าสุด · ไม่แตะ localStorage จึงไม่ลบดวง (แอปไม่ใช้ cookies)
      { label: "🔄 อัปเดตแอป (ล้างแคช · ดวงไม่หาย)", run: async () => {
          const i = await A.dialog({ title: "อัปเดตแอป", message: "ล้างไฟล์แอปที่เบราว์เซอร์เก็บไว้ แล้วโหลดรุ่นล่าสุดจากเว็บ\nดวงที่บันทึกไว้ไม่หาย · ต้องต่อเน็ตอยู่", actions: ["🔄 อัปเดตเลย"], cancel: "ยกเลิก" });
          if (i !== 0) return;
          if (A.refresh) await A.refresh(); else A.reload(); } },
    ];
    return { globals: { FileManager, Timer, Script, Alert, WebView, ShareSheet }, nav, back, waitNext, html: () => HTML, exportData, importData, _menu: HOST_MENU };
  }

  const API = { createHost, backTarget, rewritePage };
  if (typeof module !== "undefined" && module.exports && typeof window === "undefined") { module.exports = API; return; }

  // ================= adapter ฝั่งเบราว์เซอร์ =================
  const D = G.document, frame = D.getElementById("app");
  let store; try { G.localStorage.setItem("s7t", "1"); G.localStorage.removeItem("s7t"); store = G.localStorage; }
  catch (e) { const m = {}; store = { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; G.__S7_NOSTORE = true; }
  function el(tag, attrs, kids) { const e = D.createElement(tag); Object.assign(e, attrs || {}); (kids || []).forEach(k => e.appendChild(typeof k === "string" ? D.createTextNode(k) : k)); return e; }
  let closeDlg = null;
  // รอบ 88 (ข้อตัดสิน 115): หัวเมนู 🔮 มีบรรทัด "✦ สร้างและพัฒนาโดย ✦" ตามด้วยชื่อ → วาดเป็นแถบเครดิตเด่น (Scriptable แสดงเป็นข้อความเดิม)
  const DEV_MK = "\n\n✦ สร้างและพัฒนาโดย ✦\n";
  function dlgMsg(box, m) {
    const k = m.indexOf(DEV_MK);
    if (k < 0) { box.appendChild(el("div", { className: "dm" }, [m])); return; }
    const top = m.slice(0, k).trim(), name = m.slice(k + DEV_MK.length).trim();
    if (top) box.appendChild(el("div", { className: "dm" }, [top]));
    const lab = el("div", {}, ["✦ สร้างและพัฒนาโดย ✦"]), nm = el("div", {}, [name]), cr = el("div", { className: "dcr" }, [lab, nm]);
    cr.setAttribute("style", "margin:10px 0 12px;padding:14px 12px 13px;border-radius:14px;text-align:center;background:linear-gradient(135deg,#f3dc9f 0%,#d9b062 55%,#b8893a 100%);color:#2a1c05;box-shadow:0 3px 12px rgba(120,84,20,.28),inset 0 0 0 1px rgba(255,255,255,.45)");
    lab.setAttribute("style", "font-size:12px;letter-spacing:.12em;font-weight:700;opacity:.78;margin-bottom:3px");
    nm.setAttribute("style", "font-size:21px;font-weight:800;line-height:1.35;letter-spacing:.01em;text-shadow:0 1px 0 rgba(255,255,255,.5)");
    box.appendChild(cr);
  }
  function dialog(o) {
    return new Promise(res => {
      const box = el("div", { className: "dlg" }), wrap = el("div", { className: "dlgw" }, [box]);
      const done = i => { wrap.remove(); closeDlg = null; res(i); };
      if (o.title) box.appendChild(el("div", { className: "dt" }, [o.title]));
      if (o.message) dlgMsg(box, String(o.message));
      o.actions.forEach((t, i) => box.appendChild(el("button", { className: "db", onclick: () => done(i) }, [t])));
      if (o.cancel) box.appendChild(el("button", { className: "db dc", onclick: () => done(-1) }, [o.cancel]));
      wrap.addEventListener("click", e => { if (e.target === wrap && o.cancel) done(-1); });
      closeDlg = () => done(-1);
      D.body.appendChild(wrap);
    });
  }
  function askImport() {
    return new Promise(res => {
      const ta = el("textarea", { className: "dta", placeholder: "วางข้อความ profiles.json ที่ส่งมาจาก iPhone ที่นี่" });
      const fi = el("input", { type: "file", accept: ".json,.txt,application/json,text/plain", style: "display:none" });
      const box = el("div", { className: "dlg" }), wrap = el("div", { className: "dlgw" }, [box]);
      const done = v => { wrap.remove(); closeDlg = null; res(v); };
      fi.onchange = () => { const f = fi.files && fi.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => done(String(r.result || "")); r.readAsText(f); };
      [el("div", { className: "dt" }, ["นำเข้าดวง"]), el("div", { className: "dm" }, ["วางข้อความ หรือเลือกไฟล์ .json · ดวงที่ id ซ้ำจะถูกแทนด้วยของใหม่"]), ta,
        el("button", { className: "db", onclick: () => done(ta.value) }, ["นำเข้าข้อความที่วาง"]),
        el("button", { className: "db", onclick: () => fi.click() }, ["เลือกไฟล์…"]), fi,
        el("button", { className: "db dc", onclick: () => done(null) }, ["ยกเลิก"])].forEach(k => box.appendChild(k));
      closeDlg = () => done(null); D.body.appendChild(wrap);
    });
  }
  // รอบ 92 ข้อ 122: ยกเลิก service worker · ลบแคช satta7-web-* · ดึงไฟล์แอปใหม่ข้ามแคชเบราว์เซอร์ · โหลดใหม่ (localStorage คงเดิม)
  async function refreshApp() {
    try { const sw = G.navigator.serviceWorker; if (sw && sw.getRegistrations) { const rs = await sw.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); } } catch (e) {}
    try { if (G.caches) { const ks = await G.caches.keys(); await Promise.all(ks.filter(k => /^satta7-web/.test(k)).map(k => G.caches.delete(k))); } } catch (e) {}
    try { await Promise.all(["./", "index.html", "host.js", "satta7.js", "sw.js"].map(f => G.fetch(f, { cache: "reload" }).catch(() => null))); } catch (e) {}
    try { const u = new URL(G.location.href); u.searchParams.set("u", Date.now().toString(36)); G.location.replace(u.toString()); } catch (e) { G.location.reload(); }
  }
  async function exportFile(name, text) {
    try { const f = new File([text], name, { type: "application/json" });
      if (G.navigator.canShare && G.navigator.canShare({ files: [f] })) { await G.navigator.share({ files: [f], title: name }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = el("a", { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: name }); D.body.appendChild(a); a.click(); a.remove();
  }
  // รอบ 98: แชร์ข้อความ · เมนูแชร์ของเครื่องก่อน · ไม่มีให้คัดลอก · คัดลอกไม่ได้ให้แสดงข้อความ
  async function share(text) {
    try { if (G.navigator.share) { await G.navigator.share({ text }); return "shared"; } } catch (e) { if (e && e.name === "AbortError") return "cancel"; }
    try { if (G.navigator.clipboard && G.navigator.clipboard.writeText) { await G.navigator.clipboard.writeText(text);
      await dialog({ title: "คัดลอกสรุปแล้ว", message: text, actions: [], cancel: "ปิด" }); return "copied"; } } catch (e) {}
    await dialog({ title: "สรุปผังจำลอง", message: text + "\n\n(เบราว์เซอร์นี้แชร์ไม่ได้ · กดค้างที่ข้อความเพื่อคัดลอก)", actions: [], cancel: "ปิด" }); return "shown";
  }
  let pageWin = null;
  function render(html) {
    return new Promise(res => {
      frame.onload = () => {
        pageWin = frame.contentWindow;
        try {
          Object.defineProperty(pageWin, "__s7loc", { configurable: true, set: u => { setTimeout(() => go(u), 0); }, get: () => "" });
          pageWin.addEventListener("click", e => {   // รอให้สคริปต์ของหน้าทำงานก่อน (bubble) · ถ้าหน้าสั่ง preventDefault ไม่ไปต่อ เหมือน Scriptable
            if (e.defaultPrevented) return;
            const a = e.target && e.target.closest ? e.target.closest("a[href]") : null; if (!a) return;
            const h = a.getAttribute("href") || "";
            if (h.indexOf("satta7://") === 0) { e.preventDefault(); go(h); }
            else if (/^https?:/i.test(h)) { e.preventDefault(); G.open(h, "_blank", "noopener"); }
          });
        } catch (e) {}
        res();
      };
      frame.srcdoc = html;
    });
  }
  function evalPage(code) { try { return pageWin ? pageWin.eval(code) : 0; } catch (e) { return 0; } }
  const H = createHost({ store, render, evalPage, dialog, askImport, exportFile, share, refresh: refreshApp, reload: () => G.location.reload() });
  // ปุ่มย้อนกลับ: เก็บสถานะประวัติไว้หนึ่งช่องเสมอ · กดย้อน → ปุ่มกลับของหน้า · ถ้าหน้าไม่เปลี่ยน (หน้าแรก) ปล่อยให้ออกจากแอป
  function go(u) { H.nav(u); }
  G.history.replaceState({ s7: 0 }, ""); G.history.pushState({ s7: 1 }, "");
  G.addEventListener("popstate", async () => {
    if (closeDlg) { closeDlg(); G.history.pushState({ s7: 1 }, ""); return; }
    const before = H.html(), w = H.waitNext(8000);
    if (!H.back()) { G.history.back(); return; }
    await w;
    if (H.html() === before) G.history.back(); else G.history.pushState({ s7: 1 }, "");
  });
  Object.assign(G, H.globals);
  G.S7HOST = H;
  if (G.__S7_NOSTORE) G.addEventListener("load", () => dialog({ title: "บันทึกดวงไม่ได้", message: "เบราว์เซอร์นี้ไม่ให้เก็บข้อมูล (เช่นโหมดไม่ระบุตัวตน) ดวงที่บันทึกจะหายเมื่อปิดหน้า", actions: ["ตกลง"], cancel: null }));
  if ("serviceWorker" in G.navigator && /^https?:$/.test(G.location.protocol)) G.addEventListener("load", () => { G.navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {}); });
})(typeof window !== "undefined" ? window : globalThis);
