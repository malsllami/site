window._sid = "";
window._months = [];

(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مشترك"){
    location.href = "register.html";
    return;
  }

  const sid = q("معرف") || "";
  if(!sid){
    msg("err", "معرف الجمعية غير موجود بالرابط");
    return;
  }
  window._sid = sid;

  try{
    const d = await get("رغبات حالة", { token: s.token, معرف_الجمعية: sid });
    const soc = d.جمعية;
    const months = d.الاشهر || [];
    window._months = months;

    setHtml("socSummary",
      `<div class="kv"><div class="k">اسم الجمعية</div><div class="v">${esc(soc.اسم)}</div></div>
       <div class="kv"><div class="k">الحالة</div><div class="v">${badge(soc.حالة)}</div></div>
       <div class="kv"><div class="k">عدد اسهمك</div><div class="v">${esc(d.عدد_اسهم_المشترك)}</div></div>
       <div class="small mt8">يجب ان يساوي مجموع الاسهم في الجدول عدد اسهمك</div>`
    );

    const pref = d.رغبات || null;

    const rows = months.map((m, idx) => {
      const n = idx + 1;
      const v = pref ? Number(pref["شهر " + n] || 0) : 0;
      const t = pref ? String(pref["نوع " + n] || "قابل للتعديل") : "قابل للتعديل";
      return `
        <tr>
          <td>${esc(m)}</td>
          <td><input id="m_${n}" type="number" step="0.5" min="0" value="${esc(v)}"></td>
          <td>
            <select id="t_${n}">
              <option value="قابل للتعديل" ${t === "قابل للتعديل" ? "selected" : ""}>قابل للتعديل</option>
              <option value="ضروري" ${t === "ضروري" ? "selected" : ""}>ضروري</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");

    setHtml("prefTable",
      `<table class="table">
         <thead>
           <tr>
             <th>الشهر الميلادي</th>
             <th>عدد الاسهم</th>
             <th>النوع</th>
           </tr>
         </thead>
         <tbody>${rows}</tbody>
       </table>`
    );

  }catch(e){
    msg("err", e.message);
  }
})();

function disable(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.disabled = !!on;
  el.style.opacity = on ? "0.7" : "1";
  el.style.pointerEvents = on ? "none" : "auto";
}

async function savePrefs(){
  const s = جلسة();
  msg("", "");
  disable("btnSave", true);

  try{
    const body = { action: "حفظ الرغبات", token: s.token, معرف_الجمعية: window._sid };
    for(let i = 1; i <= window._months.length; i++){
      body["شهر" + i] = document.getElementById("m_" + i).value.trim();
      body["نوع" + i] = document.getElementById("t_" + i).value;
    }

    await post(body);
    msg("ok", "تم حفظ الرغبات");
    location.href = "society.html?معرف=" + encodeURIComponent(window._sid);
  }catch(e){
    msg("err", e.message);
  }finally{
    disable("btnSave", false);
  }
}
