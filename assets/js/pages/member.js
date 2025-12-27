(async function(){
  const s = جلسة();
  if(!s.token || s.role!=="مشترك"){
    location.href="register.html";
    return;
  }

  try{
    const data = await get("معلومات مشترك",{ token:s.token });
    const u = data.مستخدم;

    document.title = "صفحتي - " + u.الاسم;
    setText("pageTitle","صفحتي - " + u.الاسم);

    if(u.رمز){
      document.getElementById("pinArea").style.display="";
      document.getElementById("myPinValue").textContent=u.رمز;
    }

    setHtml("info",`
      <div class="kv"><div class="k">الاسم</div><div class="v">${esc(u.الاسم)}</div></div>
      <div class="kv"><div class="k">الجوال</div><div class="v">${esc(u.رقم_الجوال)}</div></div>
    `);

    const subs = await get("جمعيات المشترك",{ token:s.token });
    renderMySocieties(subs.اشتراكات || []);

    const all = await get("قائمة الجمعيات");
    renderAvailable(all.جمعيات || [], subs.اشتراكات || []);

  }catch(e){
    msg("err",e.message);
  }
})();

function renderMySocieties(arr){
  if(!arr.length){
    setHtml("mySocieties","<div class='warn warn-gray'>لا توجد جمعيات</div>");
    return;
  }

  setHtml("mySocieties",arr.map(s=>`
    <div class="listItem">
      <div class="listTop">
        <b>${esc(s.اسم_الجمعية)}</b>
        ${badge(s.حالة)}
      </div>
      <div class="listMeta">
        <span class="pillSmall">اسهمي ${s.عدد_الاسهم}</span>
      </div>
      <div class="listActions">
        <button class="btn" onclick="location.href='society.html?معرف=${s.معرف_الجمعية}'">فتح</button>
        ${s.حالة==="جديدة" ? `<button class="btn btn2" onclick="location.href='preferences.html?معرف=${s.معرف_الجمعية}'">رغباتي</button>` : ""}
      </div>
    </div>
  `).join(""));
}

function renderAvailable(all, mine){
  const myIds = new Set(mine.map(x=>x.معرف_الجمعية));
  const available = all.filter(s=>s.حالة==="جديدة" && !myIds.has(s.معرف));

  if(!available.length){
    setHtml("availableSocieties","<div class='warn warn-gray'>لا توجد جمعيات متاحة</div>");
    return;
  }

  setHtml("availableSocieties",available.map(s=>`
    <div class="soc" onclick="location.href='society.html?معرف=${s.معرف}'">
      <b>${esc(s.اسم)}</b>
      <div class="mt8">${badge(s.حالة)}</div>
    </div>
  `).join(""));
}

function copyMyPin(){
  const pin = document.getElementById("myPinValue").textContent;
  navigator.clipboard.writeText(pin);
  document.getElementById("pinStickyWarn").style.display="none";
  msg("ok","تم نسخ PIN");
}
