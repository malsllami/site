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

function بطاقة_جمعية(s){
  return `<div class="col-4">
    <div class="soc">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>${esc(s.اسم)}</b>
        ${badge(s.حالة)}
      </div>
      <div style="margin-top:8px">تاريخ البداية ${esc(s.تاريخ_البداية||"")}</div>
      <div>تاريخ النهاية ${esc(s.تاريخ_النهاية||"")}</div>
      <div>عدد المشتركين ${esc(s.عدد_المشتركين||0)}</div>
      <div>عدد الاسهم ${esc(s.عدد_الاسهم||0)}</div>
      <div>قيمة الجمعية الاجمالي ${esc(s.اجمالي_القيمة||0)}</div>
    </div>
  </div>`;
}

async function adminLogin(){
  msg("", "");
  try{
    const رمز = document.getElementById("adminPin").value.trim();
    const data = await post({ action:"دخول بالرمز", رمز });
    if(data.دور!=="مدير") throw new Error("هذا الرمز ليس للمدير");

    حفظ_جلسة(data.token, "مدير");
    showPanel(true);
    await loadAdminData();
  }catch(e){
    msg("err", e.message);
  }
}

async function loadAdminData(){
  const s = جلسة();
  try{
    const data = await get("معلومات مدير", { token:s.token });

    const members = data.مشتركين || [];
    const societies = data.جمعيات || [];

    if(!societies.length){
      setHtml("societiesAdmin","<div class='col-12'>لا توجد جمعيات</div>");
    }else{
      setHtml("societiesAdmin", societies.map(بطاقة_جمعية).join(""));
    }

    if(!members.length){
      setHtml("members","لا يوجد مشتركين");
    }else{
      const rows = members.map(x=>{
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
    }
  }catch(e){
    msg("err", e.message);
  }
}

let قفل_انشاء = false;

async function createSoc(){
  if(قفل_انشاء) return;

  msg("", "");
  const s = جلسة();

  try{
    const اسم_الجمعية = document.getElementById("socName").value.trim();
    const تاريخ_البداية = document.getElementById("socStart").value.trim();

    const btn = document.getElementById("btnCreate");
    قفل_انشاء = true;
    if(btn) btn.disabled = true;

    await post({ action:"انشاء جمعية", token:s.token, اسم_الجمعية, تاريخ_البداية });

    msg("ok","تم انشاء الجمعية");
    await loadAdminData();
    document.getElementById("socName").value = "";
    document.getElementById("socStart").value = "";
  }catch(e){
    msg("err", e.message);
  }finally{
    const btn = document.getElementById("btnCreate");
    قفل_انشاء = false;
    if(btn) btn.disabled = false;
  }
}

(function(){
  const s = جلسة();
  if(s.token && s.role==="مدير"){
    showPanel(true);
    loadAdminData();
  }
})();
