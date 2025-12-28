(async function(){
  const s = جلسة()
  if(!s.token || s.role !== "مدير"){
    location.href = "register.html"
    return
  }

  const btn = document.getElementById("btnCreateSoc")
  if(btn){
    btn.addEventListener("click", async function(e){
      e.preventDefault()
      await createSociety()
    })
  }

  await loadAdmin()
})()

async function loadAdmin(){
  const s = جلسة()
  msg("", "")

  try{
    const d = await get("معلومات مدير", { token: s.token })
    const arr = d.جمعيات || []

    if(!arr.length){
      setHtml("socList", "<div class='warn warn-gray'>لا يوجد جمعيات</div>")
      return
    }

    const html = arr.map(x => `
      <div class="soc">
        <b>${esc(x.اسم)}</b>
        <div class="mt8">${badge(x.حالة)}</div>
        <div class="mt8">عدد المشتركين ${esc(x.عدد_المشتركين || 0)}</div>
        <div class="mt8">عدد الاسهم ${esc(x.عدد_الاسهم || 0)}</div>
        <div class="mt12 align-end">
          <button class="btn btn2" type="button" onclick="openSociety('${esc(x.معرف)}')">فتح</button>
        </div>
      </div>
    `).join("")

    setHtml("socList", html)

  }catch(e){
    msg("err", e.message)
  }
}

function openSociety(id){
  if(!id) return
  location.href = "admin_member.html?معرف=" + encodeURIComponent(String(id))
}

async function createSociety(){
  const s = جلسة()
  msg("", "")

  const name = (document.getElementById("socName").value || "").trim()
  const start = (document.getElementById("socStart").value || "").trim()

  if(!name){
    msg("err", "اسم الجمعية مطلوب")
    return
  }
  if(!start){
    msg("err", "تاريخ البداية مطلوب")
    return
  }

  try{
    await post({
      action: "انشاء جمعية",
      token: s.token,
      اسم_الجمعية: name,
      تاريخ_البداية: start
    })

    document.getElementById("socName").value = ""
    msg("ok", "تم انشاء الجمعية")
    await loadAdmin()

  }catch(e){
    msg("err", e.message)
  }
}
