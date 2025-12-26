function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

(async function(){
  const sid = q("معرف");
  if(!sid){
    msg("err","معرف الجمعية غير موجود");
    return;
  }

  const s = جلسة();
  const token = s && s.token ? s.token : "";

  try{
    // لو مشترك, نجيب تفاصيل مع حالته في الجمعية
    let data;
    if(token && s.role==="مشترك"){
      data = await get("تفاصيل جمعية للمشترك", { token: token, معرف_الجمعية: sid });
    }else{
      const d2 = await get("تفاصيل جمعية", { معرف_الجمعية: sid });
      data = { جمعية: d2.جمعية, مشترك_مسجل:false, عدد_اسهم_المشترك:0 };
    }

    const soc = data.جمعية;

    setHtml("socInfo",
      "اسم الجمعية <b>" + esc(soc.اسم) + "</b><br>" +
      "تاريخ البداية <b>" + esc(soc.تاريخ_البداية) + "</b><br>" +
      "تاريخ النهاية <b>" + esc(soc.تاريخ_النهاية) + "</b><br>" +
      "الحالة <b>" + esc(soc.حالة) + "</b><br>" +
      "عدد المشتركين <b>" + esc(soc.عدد_المشتركين) + "</b><br>" +
      "عدد الاسهم <b>" + esc(soc.عدد_الاسهم) + "</b><br>" +
      "قيمة الجمعية الاجمالي <b>" + esc(soc.اجمالي_القيمة) + "</b>"
    );

    // اكشن الرغبات
    if(token && s.role==="مشترك" && data.مشترك_مسجل && String(soc.حالة)==="جديدة"){
      setHtml("actions", `
        <button class="btn" onclick="location.href='preferences.html?معرف=${encodeURIComponent(sid)}'">ادارة الرغبات</button>
      `);
    }else{
      setHtml("actions", `<div class="warn warn-gray">سيتم اكمال الرغبات والتحصيل والتسليم لاحقا</div>`);
    }

    // صندوق التسجيل
    if(!token || s.role!=="مشترك"){
      setHtml("joinBox", `<div class="warn warn-gray">سجل دخول كمشترك للتسجيل في الجمعية</div>`);
      return;
    }

    if(String(soc.حالة) !== "جديدة"){
      setHtml("joinBox", `<div class="warn warn-gray">التسجيل متاح فقط في جمعية جديدة</div>`);
      return;
    }

    if(data.مشترك_مسجل){
      setHtml("joinBox", `<div class="warn warn-gray">انت مشترك مسبقا في هذه الجمعية</div>`);
      return;
    }

    setHtml("joinBox", `
      <div class="grid">
        <div class="col-6">
          <input class="input" id="shares" placeholder="عدد الاسهم مثل 1 او 0.5">
          <div style="margin-top:6px;font-size:13px;color:#666">ملاحظة , يسمح بنصف سهم كحد ادنى</div>
        </div>
        <div class="col-6">
          <button class="btn" id="btnJoin">حفظ وارسال</button>
        </div>
      </div>
    `);

    document.getElementById("btnJoin").onclick = async function(){
      try{
        const shares = document.getElementById("shares").value;
        await get("اشتراك جمعية", { token: token, معرف_الجمعية: sid, عدد_الاسهم: shares });
        msg("ok","تم التسجيل بنجاح");
        setTimeout(()=> location.reload(), 600);
      }catch(e){
        msg("err", e.message || String(e));
      }
    };

  }catch(e){
    msg("err", e.message || String(e));
  }
})();
