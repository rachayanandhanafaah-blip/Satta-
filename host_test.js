// ชุดตรวจ host.js (รอบ 82 · รอบ 92 แก้/ลบดวง · ปุ่ม ↑ · อัปเดตแอป · รอบ 98 ผังจำลองยามจร แชร์สรุป): รัน satta7.js ตัวจริงผ่าน host ใน Node ด้วย adapter จำลอง · ไม่ต้องมีเบราว์เซอร์
// ใช้: node host_test.js [satta7.js]
process.env.TZ = "Asia/Bangkok";
const fs = require("fs"), vm = require("vm"), path = require("path");
const HOSTF = path.join(__dirname, "host.js"), APPF = path.resolve(process.argv[2] || path.join(__dirname, "satta7.js"));
const { createHost, backTarget, rewritePage } = require(HOSTF);
const SRC = fs.readFileSync(APPF, "utf8");
let ok = 0, fail = 0; const T = (c, m) => { if (c) { ok++; if (m) console.log("✓", m); } else { fail++; console.log("✗", m); } };
function boot(store, script) {
  const log = { pages: [], dialogs: [], exports: [], reloads: 0, evals: [], refreshes: 0, shares: [] }, Q = script || [];
  const map = store || new Map();
  const st = { getItem: k => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) };
  const A = { store: st, render: async h => { log.pages.push(h); }, evalPage: c => { log.evals.push(c); return /pageYOffset/.test(c) ? 0 : undefined; },
    dialog: async o => { log.dialogs.push(o); const f = Q.shift(); return typeof f === "function" ? f(o) : (f == null ? -1 : f); },
    askImport: async () => log.importText, exportFile: async (n, t) => { log.exports.push({ n, t }); }, reload: () => { log.reloads++; }, refresh: async () => { log.refreshes++; }, share: async t => { log.shares.push(t); return "shared"; } };
  const H = createHost(A);
  const ctx = vm.createContext({ ...H.globals, console, setTimeout, clearTimeout, setInterval, clearInterval, Intl, Date, Math, JSON, encodeURIComponent, decodeURIComponent });
  vm.runInContext(SRC, ctx, { filename: "satta7.js" });
  return { H, log, map, ctx };
}
const settle = async (H, ms) => { await H.waitNext(ms || 15000); await new Promise(r => setTimeout(r, 5)); };
const links = h => [...new Set((String(h).match(/href="satta7:\/\/[^"]*"/g) || []).map(x => x.slice(6, -1).replace(/&amp;/g, "&")))];
const errDlg = log => log.dialogs.filter(d => /เกิดข้อผิดพลาด|เปิดไม่ได้/.test(d.title));
(async () => {
  // 1 เปิดครั้งแรก (ยังไม่มีดวง) → หน้าแบบฟอร์ม · ตรวจตัวเปลี่ยน location.href
  const A1 = boot(); await settle(A1.H);
  const f0 = A1.H.html();
  T(/id="iso"/.test(f0) && f0.indexOf("__s7loc=") > 0 && !/location\.href\s*=\s*"satta7/.test(f0), "เปิดครั้งแรกเป็นแบบฟอร์ม · location.href ของปุ่มบันทึกถูกเปลี่ยนเป็น __s7loc");
  T(A1.ctx.SCRIPTABLE === undefined || true, "");
  T(vm.runInContext("SCRIPTABLE && !NODE", A1.ctx) === true, "แอปเห็นตัวเองอยู่บน Scriptable (ใช้ host แทน) ไม่เข้าทาง Node");
  // 2 บันทึกดวง → ผัง · เก็บลง localStorage
  const P1 = { id: null, name: "ทดสอบ", iso: "1992-12-12", time: "10:50", sex: "f", order: "", tAuto: 0 };
  A1.H.nav("satta7://save?d=" + encodeURIComponent(JSON.stringify(P1))); await settle(A1.H);
  const prof = JSON.parse(A1.map.get("s7fs:/Documents/satta7/profiles.json") || "[]");
  T(prof.length === 1 && prof[0].iso === "1992-12-12" && A1.H.html().indexOf("ทดสอบ") > 0 && A1.H.html().indexOf('class="bar') > 0, "บันทึกดวงแล้วได้หน้าผัง · profiles.json อยู่ใน localStorage");
  // 3 ผังเหมือนแอปฝั่ง Node (mpBuild/mpRender) ทุกแท็บ
  const N = (() => { const m = { exports: {} }; vm.runInNewContext(SRC + "\n;module.exports.__h={mpBuild,mpRender,natalChart,curProfile:typeof curProfile!=='undefined'?curProfile:null};", { module: m, console, Date, Intl, Math, JSON, setTimeout }); return m.exports.__h; })();
  const ch = N.natalChart(prof[0]), M = N.mpBuild(ch, null, null);
  let same = 0;
  for (const t of ["s1", "s2", "s3", "s4", "s5"]) { A1.H.nav("satta7://tab?t=" + t); await settle(A1.H); if (A1.H.html() === rewritePage(N.mpRender(M, { r: "tab", k: t, y: 0 }, t))) same++; }
  T(same === 5, `หน้าแท็บ s1–s5 ผ่าน host ตรงกับแอปฝั่ง Node ทุกไบต์ (${same}/5)`);
  T(A1.H.html().indexOf("ปกิณกะ") > 0, "แท็บ s5 ปกิณกะแสดงได้");
  // 4 เมนู: ปุ่มของแอป + ปุ่ม host · เกี่ยวกับ · ส่งออก
  A1.log.dialogs.length = 0;
  const A1q = []; const menuPick = i => { A1q.push(i); };
  const run = async (u, pick) => { if (pick !== undefined) A1Q.push(pick); A1.H.nav(u); await settle(A1.H); };
  const A1Q = []; A1.H._q = A1Q;
  // ใส่คิวผ่าน dialog ที่ boot ส่งไว้ (Q อ้างอาร์เรย์เดิม)
  const B = boot(A1.map, [4]); await settle(B.H);
  T(B.H.html().indexOf("ทดสอบ") > 0, "เปิดแอปใหม่ด้วย localStorage เดิม → กลับมาที่ดวงที่บันทึก");
  B.H.nav("satta7://menu"); await settle(B.H);
  const md = B.log.dialogs.find(d => /^🔮/.test(d.title));
  T(md && md.actions.length === 8 && /ส่งออก/.test(md.actions[5]) && /นำเข้า/.test(md.actions[6]) && /อัปเดตแอป/.test(md.actions[7]) && md.cancel === "ปิด", "เมนูมีปุ่มของแอป ๕ ปุ่ม + ส่งออก/นำเข้าดวง + อัปเดตแอป + ปิด");
  T(/เกี่ยวกับ/.test(B.H.html()) || /ตรวจกับตำรา/.test(B.H.html()), "เมนู → เกี่ยวกับ (ปุ่มที่ ๕ ของแอป)");
  const C = boot(A1.map, [5]); await settle(C.H); C.H.nav("satta7://menu"); await settle(C.H, 3000);
  const ex = C.log.exports[0]; let exo = null; try { exo = JSON.parse(ex.t); } catch (e) {}
  T(ex && ex.n === "satta7_profiles.json" && exo && exo.profiles.length === 1 && exo.profiles[0].name === "ทดสอบ" && !errDlg(C.log).length, "ส่งออกดวงได้ไฟล์ JSON มีดวงที่บันทึก · แอปไม่ทำอะไรต่อ");
  // 5 นำเข้า: อาร์เรย์ profiles.json จาก iPhone · id ซ้ำแทนของเดิม
  const IP = [{ id: "pA", name: "แม่", iso: "1965-03-04", time: "", sex: "f", order: "" }, { id: prof[0].id, name: "ทดสอบแก้", iso: "1992-12-12", time: "10:50", sex: "f", order: "" }];
  const D2 = boot(A1.map, [6, 0]); D2.log.importText = JSON.stringify(IP); await settle(D2.H); D2.H.nav("satta7://menu"); await settle(D2.H, 3000); await new Promise(r => setTimeout(r, 50));
  const p2 = JSON.parse(A1.map.get("s7fs:/Documents/satta7/profiles.json"));
  T(p2.length === 2 && p2.find(p => p.id === prof[0].id).name === "ทดสอบแก้" && D2.log.reloads === 1 && D2.log.dialogs.some(d => d.title === "นำเข้าแล้ว"), "นำเข้า profiles.json จาก iPhone: รวม ๒ ดวง · id ซ้ำแทนของเดิม · โหลดแอปใหม่");
  const H0 = createHost({ store: { getItem: () => null, setItem() {}, removeItem() {} } });
  T(!H0.importData("abc").ok && !H0.importData('{"x":1}').ok && !H0.importData('[{"name":"x"}]').ok, "นำเข้าข้อมูลผิดรูปแบบถูกปฏิเสธพร้อมเหตุผล");
  // 6 ไล่กดทุกลิงก์ (BFS) · ไม่มีกล่องข้อผิดพลาด · ทุกหน้าย่อยมีปุ่มกลับ
  const E = boot(A1.map); await settle(E.H);
  E.H.nav("satta7://pick?id=" + prof[0].id); await settle(E.H);
  const seen = new Set(), q = links(E.H.html()).map(u => ({ u, from: "satta7://tabtop" })); let n = 0, noBack = 0, nb = [], roots = 0;
  const SKIP = /^satta7:\/\/(menu|save|chk|del|top)/;   // รอบ 92: del (ลบดวง) และ top (ไม่โหลดหน้าใหม่) ตรวจแยกในข้อ 9
  while (q.length && n < 700) {
    const { u } = q.shift(); if (seen.has(u) || SKIP.test(u)) continue; seen.add(u); n++;
    E.H.nav(u); await settle(E.H, 20000);
    const h = E.H.html();
    const root = /href="satta7:\/\/tab\?t=s1"/.test(h) && /href="satta7:\/\/tab\?t=s5"/.test(h) && !/class="bb pri"/.test(h);   // หน้าแท็บบนสุด: ย้อนกลับ = ออกจากแอป
    if (root) roots++;
    if (!backTarget(h) && !root && !/class="bb pri" href="satta7:\/\/new/.test(h)) { noBack++; nb.push(u + " :: " + ((/<title>([^<]*)/.exec(h) || [])[1] || "")); }
    links(h).forEach(v => { if (!seen.has(v)) q.push({ u: v }); });
  }
  T(n >= 150 && !errDlg(E.log).length, `ไล่กดลิงก์ในแอป ${n} ลิงก์ ไม่มีกล่องข้อผิดพลาด`);
  T(noBack === 0 && roots > 0, `ทุกหน้าที่ไม่ใช่หน้าแท็บบนสุดมีปุ่มกลับให้ปุ่มย้อนกลับของ Android (หน้าแท็บบนสุด ${roots} · ไม่มีปุ่มกลับ ${noBack}: ${nb.slice(0, 6).join(" | ")})`);
  // 7 ปุ่มย้อนกลับ: หน้าเรื่อง → กลับหน้าแท็บ · หน้าแรกกดแล้วหน้าเดิม (ปล่อยออกจากแอป)
  E.H.nav("satta7://tab?t=s1"); await settle(E.H); const top = E.H.html();
  const pl = links(top).find(x => /^satta7:\/\/(p|cell)\?/.test(x)); E.H.nav(pl); await settle(E.H); const sub = E.H.html();
  E.H.back(); await settle(E.H); const aft = E.H.html();
  E.H.back(); await settle(E.H, 3000); const aft2 = E.H.html();
  T(sub !== top && aft === top && aft2 === top, "ปุ่มย้อนกลับ: หน้าย่อย → หน้าแท็บ · หน้าแท็บกดซ้ำได้หน้าเดิม (host ปล่อยให้ออกจากแอป)");
  // 8 สลับขนาดตัวอักษร จำค่า
  const big0 = !!JSON.parse(A1.map.get("s7fs:/Documents/satta7/state.json")).big;
  E.H.nav("satta7://fs"); await settle(E.H);
  const big1 = !!JSON.parse(A1.map.get("s7fs:/Documents/satta7/state.json")).big;
  T(big1 === !big0 && /<body class="[^"]*big/.test(E.H.html()) === big1, "สลับตัวอักษรใหญ่ จำค่าใน state.json และหน้าใช้ค่าใหม่");
  T(backTarget('<a class="bb pri" href="satta7://up">') === "satta7://up" && backTarget("<p>x</p>") === null && rewritePage('location.href="satta7://save?d="+x').indexOf("__s7loc=") === 0, "backTarget / rewritePage");
  // 9 รอบ 92 ข้อ 121: หน้ารายชื่อมี ✎ แก้ · 🗑 ลบ ทุกดวง · แถบหน้าแท็บไม่มี "แก้วันเกิด" · ลบต้องยืนยัน
  const L0 = JSON.parse(A1.map.get("s7fs:/Documents/satta7/profiles.json"));
  T(!/satta7:\/\/edit"/.test(top) && !/แก้วันเกิด/.test(top) && /href="satta7:\/\/list"/.test(top), "แถบหน้าแท็บไม่มีปุ่มแก้วันเกิดแล้ว (ยังมีเลือกดวง)");
  const G1 = boot(A1.map); await settle(G1.H); G1.H.nav("satta7://list"); await settle(G1.H); const lh = G1.H.html();
  T(L0.length >= 2 && L0.every(p => lh.indexOf(`satta7://edit?id=${p.id}"`) > 0 && lh.indexOf(`satta7://del?id=${p.id}"`) > 0 && lh.indexOf(`satta7://pick?id=${p.id}"`) > 0), `หน้ารายชื่อมีปุ่มเปิด · ✎ แก้ · 🗑 ลบ ครบทุกดวง (${L0.length} ดวง)`);
  const other = L0.find(p => p.id !== prof[0].id);
  G1.H.nav("satta7://edit?id=" + other.id); await settle(G1.H);
  T(/แก้ไขดวง/.test(G1.H.html()) && G1.H.html().indexOf(JSON.stringify(other.id)) > 0 && G1.H.html().indexOf(other.name) > 0, "✎ จากหน้ารายชื่อเปิดฟอร์มแก้ไขของดวงนั้น (ไม่ใช่ดวงที่เปิดอยู่)");
  const G2 = boot(A1.map, [-1]); await settle(G2.H); G2.H.nav("satta7://del?id=" + other.id); await settle(G2.H);
  const dd = G2.log.dialogs.find(d => d.title === "ลบดวงนี้?");
  T(dd && dd.cancel === "ยกเลิก" && JSON.parse(A1.map.get("s7fs:/Documents/satta7/profiles.json")).length === L0.length && /ดวงที่บันทึกไว้/.test(G2.H.html()), "🗑 กดยกเลิกในกล่องยืนยัน → ไม่ลบ อยู่หน้ารายชื่อ");
  const G3 = boot(A1.map, [0]); await settle(G3.H); G3.H.nav("satta7://del?id=" + other.id); await settle(G3.H);
  const L1 = JSON.parse(A1.map.get("s7fs:/Documents/satta7/profiles.json"));
  T(L1.length === L0.length - 1 && !L1.some(p => p.id === other.id) && G3.H.html().indexOf(`del?id=${other.id}"`) < 0 && !errDlg(G3.log).length, "🗑 ยืนยันลบ → ดวงหายจาก profiles.json และจากหน้ารายชื่อ");
  const m2 = new Map(A1.map); const G4 = boot(m2, [0]); await settle(G4.H); const cid = JSON.parse(m2.get("s7fs:/Documents/satta7/state.json")).curId;
  G4.H.nav("satta7://del?id=" + cid); await settle(G4.H); G4.H.nav("satta7://back"); await settle(G4.H);
  T(JSON.parse(m2.get("s7fs:/Documents/satta7/profiles.json")).length === L1.length - 1 && /id="iso"/.test(G4.H.html()) && !errDlg(G4.log).length, "ลบดวงที่เปิดอยู่ (ดวงสุดท้าย) → กลับผังได้หน้าแบบฟอร์มเพิ่มดวง ไม่มีข้อผิดพลาด");
  // 10 รอบ 92 ข้อ 124: ปุ่ม ↑ ทุกหน้า · แตะแล้วเลื่อนขึ้นบนสุดโดยไม่โหลดหน้าใหม่
  const G5 = boot(A1.map); await settle(G5.H); const h5 = G5.H.html(), np = G5.log.pages.length;
  G5.H.nav("satta7://top"); await new Promise(r => setTimeout(r, 120));
  T(/id="s7top" href="satta7:\/\/top"/.test(h5) && /getElementById\("s7top"\)/.test(h5) && G5.log.evals.some(c => /scrollTo\(0,0\)/.test(c)) && G5.log.pages.length === np && G5.H.html() === h5 && !errDlg(G5.log).length, "ปุ่ม ↑ มีในหน้า · แตะแล้วสั่งเลื่อนขึ้นบนสุด ไม่โหลดหน้าใหม่ ไม่มีข้อผิดพลาด");
  // 11 รอบ 92 ข้อ 122: 🔄 อัปเดตแอป → ยืนยัน → ล้างแคชและโหลดใหม่ · ดวงไม่หาย
  const snapStore = JSON.stringify([...A1.map]);
  const G6 = boot(A1.map, [-1]); await settle(G6.H); G6.H.nav("satta7://menu"); await settle(G6.H, 3000); await new Promise(r => setTimeout(r, 50));
  const G7 = boot(A1.map, [7, -1]); await settle(G7.H); G7.H.nav("satta7://menu"); await settle(G7.H, 3000); await new Promise(r => setTimeout(r, 50));
  const G8 = boot(A1.map, [7, 0]); await settle(G8.H); G8.H.nav("satta7://menu"); await settle(G8.H, 3000); await new Promise(r => setTimeout(r, 50));
  T(G6.log.refreshes === 0 && G7.log.refreshes === 0 && G7.log.dialogs.some(d => d.title === "อัปเดตแอป") && G8.log.refreshes === 1 && JSON.stringify([...A1.map]) === snapStore, "🔄 อัปเดตแอป: ยกเลิก = ไม่ทำอะไร · ยืนยัน = ล้างแคชโหลดใหม่ · ข้อมูลดวงใน localStorage คงเดิมทุกไบต์");
  // 12 รอบ 98 ข้อ 144: ผังจำลองยามจร (มีเวลาในลิงก์) · ▶ ทีละยาม · 📤 แชร์สรุปผ่าน ShareSheet ของ host ไม่โหลดหน้าใหม่
  const G9 = boot(A1.map); await settle(G9.H); G9.H.nav("satta7://sim?t=2026-11-23T01:40&m=yam"); await settle(G9.H); const h9 = G9.H.html();
  const nx = (h9.match(/href="(satta7:\/\/sim\?t=[^"]*&m=yam&step=1)"/) || [])[1], sl = (h9.match(/href="(satta7:\/\/share\?[^"]*)"/) || [])[1];
  T(/ยามจร/.test(h9) && h9.indexOf("(เวลา ๐๑.๓๑ น. · ไม่ใช่วันนี้)") > 0 && nx === "satta7://sim?t=2026-11-23T01:31&m=yam&step=1", "ผังจำลองยามจรผ่าน host: แถบบอกเวลาเริ่มยาม · ปุ่ม ▶ มีเวลาในลิงก์");
  G9.H.nav(nx.replace(/&amp;/g, "&")); await settle(G9.H); const h9b = G9.H.html();
  T(h9b.indexOf("(เวลา ๐๓.๐๑ น. · ไม่ใช่วันนี้)") > 0 && !errDlg(G9.log).length, "▶ ยามจรเดินไปยามถัดไป (๐๓.๐๑ น.)");
  const np9 = G9.log.pages.length, sl2 = (h9b.match(/href="(satta7:\/\/share\?[^"]*)"/) || [])[1];
  G9.H.nav(sl2.replace(/&amp;/g, "&")); await settle(G9.H, 3000);
  const t9 = G9.log.shares[0] || "";
  T(sl && G9.log.shares.length === 1 && t9.indexOf("🧪 ผังจำลองชะตา") === 0 && /ยามจรรอบนี้: .*๐๓\.๐๑–๐๔\.๓๐ น\./.test(t9) && /\nรอบถัดไป: /.test(t9) && !/<[a-z]/i.test(t9) && G9.log.pages.length === np9 && G9.H.html() === h9b && !errDlg(G9.log).length,
    "📤 แชร์สรุป: ShareSheet ของ host ได้ข้อความสรุปยามจร (ไม่มีแท็ก) · ไม่โหลดหน้าใหม่ ไม่มีข้อผิดพลาด");
  console.log(`host_test ${ok}/${ok + fail} ผ่าน`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("ERR", e && e.stack || e); process.exit(1); });
