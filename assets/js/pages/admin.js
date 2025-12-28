(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html";
    return;
  }

  try{
    auth_ui();

    const data = await get("معلومات مدير", { token: s.token });

    renderSocieties(data.جمعيات || []);
    renderMembers(data.مشتركين || []);

    bindCreateSociety();

  }catch(e){
    msg("err", e.message);
  }
})();

function renderSocieties(list){
  const box = document.getElementById("societies");
  if(!box) return;

  if(!list.length){
    box.innerHTML = "<div class='warn warn-gray'>لا توجد جمعيات</div>";
    return;
  }

  box.innerHTML = list.map(s => {
    const name = esc(s.اسم || "");
    const state = esc(s.حالة || "");
    const members = esc(s.عدد_المشتركين || 0);
    const shares = esc(s.عدد_الاسهم || 0);

    return `
      <div class="soc clickable" onclick="openAdminSociety('${esc(String(s.معرف || ""))}')">
        <b>${name}</b>
        <div class="mt8">${badge(state)}</div>
        <div class="mt8">عدد المشتركين ${members}</div>
        <div class="mt8">عدد الاسهم ${shares}</div>
      </div>
    `;
  }).join("");
}

function openAdminSociety(id){
  if(!id) return;
  location.href = "admin_member.html?معرف=" + encodeURIComponent(id);
}

function renderMembers(list){
  const box = document.getElementById("members");
  if(!box) return;

  if(!list.length){
    box.innerHTML = "<div class='warn warn-gray'>لا يوجد مشتركين</div>";
    return;
  }

  box.innerHTML = list.map(m => {
    return `
      <div class="soc">
        <b>${esc(m.الاسم || "")}</b>
        <div class="mt8">رقم الجوال ${esc(m.رقم_الجوال || "")}</div>
        <div class="mt8">PIN ${esc(m.رمز || "")}</div>
        <div class="mt8">${badge(m.حالة || "")}</div>
      </div>
    `;
  }).join("");
}

function bindCreateSociety(){
  const btn = document.getElementById("btnCreateSociety");
  if(!btn || btn.__bound) return;
  btn.__bound = true;

  btn.addEventListener("click", async function(){
    msg("", "");

    const s = جلسة();
    const اسم_الجمعية = (document.getElementById("societyName")?.value || "").trim();
    const تاريخ_البداية = (document.getElementById("societyStart")?.value || "").trim();

    if(!اسم_الجمعية){
      msg("err", "اسم الجمعية مطلوب");
      return;
    }

    if(!تاريخ_البداية){
      msg("err", "تاريخ البداية مطلوب");
      return;
    }

    try{
      await get("انشاء جمعية", {
        token: s.token,
        اسم_الجمعية: اسم_الجمعية,
        تاريخ_البداية: تاريخ_البداية
      });

      msg("ok", "تم انشاء الجمعية");

      const data = await get("معلومات مدير", { token: s.token });
      renderSocieties(data.جمعيات || []);

      document.getElementById("societyName").value = "";
      document.getElementById("societyStart").value = "";

    }catch(e){
      msg("err", e.message);
    }
  });
}
