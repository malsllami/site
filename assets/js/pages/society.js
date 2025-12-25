let معرف_الجمعية = "";

function قراءة_معرف(){
  const u = new URL(location.href);
  معرف_الجمعية = (u.searchParams.get("معرف") || "").trim();
  return معرف_الجمعية;
}

function عرض_جمعية(s){
  setHtml("socInfo",
    "<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap'>" +
      "<div><b>" + esc(s.اسم) + "</b></div>" +
      "<div>" + badge(s.حالة) + "</div>" +
    "</div>" +
    "<div style='margin-top:10px'>تاريخ البداية " + esc(s.تاريخ_البداية||"") + "</div>" +
    "<div>تاريخ النهاية " + esc(s.تاريخ_النهاية||"") + "</div>" +
    "<div>عدد المشتركين " + esc(s.عدد_المشتركين||0) + "</div>" +
    "<div>عدد الاسهم " + esc(s.عدد_الاسهم||0) + "</div>" +
    "<div>قيمة الجمعية الاجمالي " + esc(s.اجمالي_القيمة||0) + "</div>"
  );
}

async function تحميل(){
  msg("", "");
  const sid = قراءة_معرف();
  if(!sid){ msg("err","معرف الجمعية غير صحيح"); return; }

  try{
    const data = await get("تفاصيل جمعية", { معرف_الجمعية: sid });
    const s = data.جمعية;
    عرض_جمعية(s);

    const sess = جلسة();
    const isMember = !!sess.token && sess.role==="مشترك";
    const joinBox = document.getElementById("joinBox");

    if(isMember && s.حالة==="جديدة"){
      joinBox.style.display = "";
    }else{
      joinBox.style.display = "none";
    }
  }catch(e){
    msg("err", e.message);
  }
}

let قفل = false;

async function joinSoc(){
  if(قفل) return;
  msg("", "");

  const sess = جلسة();
  if(!sess.token || sess.role!=="مشترك"){
    msg("err","يجب تسجيل الدخول كمشترك");
    return;
  }

  try{
    const shares = document.getElementById("shares").value.trim();
    const btn = document.getElementById("btnJoin");
    قفل = true;
    if(btn) btn.disabled = true;

    await post({
      action:"اشتراك جمعية",
      token: sess.token,
      معرف_الجمعية: معرف_الجمعية,
      عدد_الاسهم: shares
    });

    msg("ok","تم تسجيل اشتراكك في الجمعية");
    setTimeout(()=>location.href="member.html", 600);
  }catch(e){
    msg("err", e.message);
  }finally{
    const btn = document.getElementById("btnJoin");
    قفل = false;
    if(btn) btn.disabled = false;
  }
}

تحميل();
