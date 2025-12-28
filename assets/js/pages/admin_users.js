(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }
  document.getElementById("navLogout").style.display = "";
  await loadUsers();
})();

async function loadUsers(){
  const s = جلسة();
  msg("", "");

  try{
    const d = await get("معلومات مدير", { token: s.token });
    const users = d.مشتركين || [];

    if(!users.length){
      setHtml("usersArea", "<div class='warn warn-gray'>لا يوجد</div>");
      return;
    }

    setHtml("usersArea", users.map(u => `
      <div class="cardItem">
        <div class="titleRow">
          <b>${esc(u.الاسم)}</b>
          <span class="pill">${esc(u.معرف)}</span>
        </div>
        <div class="meta">
          <div>رقم الجوال ${esc(u.رقم_الجوال || "")}</div>
          <div>الرمز ${esc(u.رمز || "")}</div>
          <div>الحالة ${esc(u.حالة || "")}</div>
        </div>

        <div class="actions">
          <button class="btnMini btnMiniGray" onclick="copyText('${esc(u.رمز || "")}')">نسخ الرمز</button>
          <button class="btnMini btnMiniGreen" onclick="changePin('${esc(u.معرف)}')">تعديل الرمز</button>
        </div>
      </div>
    `).join(""));

  }catch(e){
    msg("err", e.message);
  }
}

async function copyText(v){
  if(!v) return;
  try{
    await navigator.clipboard.writeText(String(v));
    msg("ok", "تم النسخ");
  }catch(e){
    msg("err", "فشل النسخ");
  }
}

async function changePin(uid){
  const newPin = prompt("اكتب رمز جديد من 6 ارقام");
  if(newPin == null) return;

  const رمز = String(newPin).trim();
  if(!/^\d{6}$/.test(رمز)){
    msg("err", "الرمز لازم 6 ارقام");
    return;
  }

  const s = جلسة();
  msg("", "");

  try{
    await post({
      action: "تحديث رمز مشترك",
      token: s.token,
      معرف_المستخدم: uid,
      رمز: رمز
    });
    msg("ok", "تم تحديث الرمز");
    await loadUsers();
  }catch(e){
    msg("err", e.message);
  }
}
