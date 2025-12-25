document.getElementById("logout").addEventListener("click", function(e){
  e.preventDefault();
  خروج();
});

function showPanel(show){
  document.getElementById("loginBox").style.display = show ? "none" : "";
  document.getElementById("adminPanel").style.display = show ? "" : "none";
}

function نسخ_نص(text){
  navigator.clipboard.writeText(String(text||""))
    .then(()=>msg("ok","تم النسخ"))
    .catch(()=>msg("err","تعذر النسخ"));
}

async function adminLogin(){
  msg("", "");

  try{
    const رمز = document.getElementById("adminPin").value.trim();
    const data = await post({ action:"دخول بالرمز", رمز });

    if(data.دور!=="مدير") throw new Error("هذا الرمز ليس للمدير");

    حفظ_جلسة(data.token, "مدير");
    showPanel(true);
    await loadMembers();
  }catch(e){
    msg("err", e.message);
  }
}

async function loadMembers(){
  const s = جلسة();

  try{
    const data = await get("معلومات مدير", { token:s.token });
    const arr = data.مشتركين || [];

    if(!arr.length){
      setHtml("members","لا يوجد مشتركين");
      return;
    }

    const rows = arr.map(x=>{
      const pin = esc(x.رمز);
      return `<tr>
        <td>${esc(x.الاسم)}</td>
        <td>${esc(x.رقم_الجوال)}</td>
        <td><b>${pin}</b></td>
        <td><button class="btn btn2" onclick="نسخ_نص('${pin}')">نسخ</button></td>
      </tr>`;
    }).join("");

    setHtml("members", `<table>
      <tr>
        <th>الاسم</th>
        <th>رقم الجوال</th>
        <th>رمز</th>
        <th>نسخ</th>
      </tr>
      ${rows}
    </table>`);
  }catch(e){
    msg("err", e.message);
  }
}

async function createSoc(){
  msg("", "");
  const s = جلسة();

  try{
    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value.trim();

    await post({ action:"انشاء جمعية", token:s.token, اسم_الجمعية, تاريخ_البداية });

    msg("ok","تم انشاء الجمعية");
    setTimeout(()=>location.href="index.html", 600);
  }catch(e){
    msg("err", e.message);
  }
}

(function(){
  const s = جلسة();
  if(s.token && s.role==="مدير"){
    showPanel(true);
    loadMembers();
  }
})();
