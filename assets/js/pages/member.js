// member.js , انسخه واستبدله بالكامل

(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مشترك"){
    location.href = "register.html";
    return;
  }

  try{
    const data = await get("معلومات مشترك", { token: s.token });
    const u = data.مستخدم;

    document.title = "صفحتي " + u.الاسم;
    setText("pageTitle", "صفحتي " + u.الاسم);

    setHtml("info", `
      <div class="kv"><div class="k">الاسم</div><div class="v">${esc(u.الاسم)}</div></div>
      <div class="kv"><div class="k">رقم الجوال</div><div class="v">${esc(u.رقم_الجوال)}</div></div>
    `);

    if(u.رمز){
      document.getElementById("pinArea").style.display = "";
      document.getElementById("myPinValue").textContent = u.رمز;
    }

    const subs = await get("جمعيات المشترك", { token:s.token });
    const arr = subs.اشتراكات || [];

    if(!arr.length){
      setHtml("mySocieties","<div class='warn warn-gray'>لا توجد جمعيات</div>");
    }else{
      setHtml("mySocieties", arr.map(x=>`
        <div class="soc">
          <b>${esc(x.اسم_الجمعية)}</b>
          <div class="mt8">عدد الاسهم ${esc(x.عدد_الاسهم)}</div>
          <div class="mt8">${badge(x.حالة)}</div>
          <div class="mt12 align-end">
            <button class="btn btn2" onclick="location.href='society.html?معرف=${x.معرف_الجمعية}'">فتح</button>
          </div>
        </div>
      `).join(""));
    }

    const all = await get("قائمة الجمعيات");
    const joined = new Set(arr.map(x=>x.معرف_الجمعية));
    const available = all.جمعيات.filter(s=>s.حالة==="جديدة" && !joined.has(s.معرف));

    if(!available.length){
      setHtml("availableSocieties","<div class='warn warn-gray'>لا يوجد</div>");
    }else{
      setHtml("availableSocieties", available.map(s=>`
        <div class="soc" onclick="location.href='society.html?معرف=${s.معرف}'">
          <b>${esc(s.اسم)}</b>
          <div class="mt8">اضغط للتسجيل</div>
        </div>
      `).join(""));
    }

  }catch(e){
    msg("err", e.message);
  }
})();

async function copyMyPin(){
  const v = document.getElementById("myPinValue").textContent;
  await navigator.clipboard.writeText(v);
  document.getElementById("pinWarn").style.display = "none";
  msg("ok","تم نسخ الرمز");
}
