function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

function round2(x){
  return Math.round(Number(x||0) * 2) / 2;
}

function buildTable(months, shares){
  let html = `
    <div style="margin-bottom:10px">عدد اسهمك <b>${esc(shares)}</b></div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">الشهر</th>
        <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">عدد الاسهم</th>
        <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">النوع</th>
      </tr>
  `;
  for(let i=0;i<months.length;i++){
    html += `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(months[i])}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">
          <input class="input" style="max-width:160px" id="m${i+1}" value="0" placeholder="0 او 0.5 او 1">
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee">
          <select class="input" style="max-width:180px" id="t${i+1}">
            <option value="قابل للتعديل">قابل للتعديل</option>
            <option value="ضروري">ضروري</option>
          </select>
        </td>
      </tr>
    `;
  }
  html += `</table>`;
  return html;
}

function renderWarnings(summary, months){
  let html = "";

  html += `<div style="margin-top:12px"></div>`;
  for(let i=0;i<summary.length;i++){
    const s = summary[i];
    if(s.حالة === "تجاوز"){
      html += `<div class="warn warn-red">تم تجاوز القدرة المتاحة للتسليم في شهر ${esc(months[i])}</div>`;
    }else if(s.حالة === "حد"){
      html += `<div class="warn warn-orange">هذا الشهر قريب من الحد الاقصى للتسليم ${esc(months[i])}</div>`;
    }else if(s.نسبة >= 0.75){
      html += `<div class="warn warn-orange">هذا الشهر عليه ضغط عالي ${esc(months[i])}</div>`;
    }
    if(s.مناسبة){
      html += `<div class="warn warn-gray">هذا الشهر موسم مصاريف ${esc(s.مناسبة)}</div>`;
    }
  }

  return html || `<div class="warn warn-gray">لا توجد تحذيرات</div>`;
}

function sumInputs(monthCount){
  let sum = 0;
  for(let i=1;i<=monthCount;i++){
    const v = round2(document.getElementById("m"+i).value);
    sum += v;
  }
  return sum;
}

(async function(){
  const s = جلسة();
  if(!s || !s.token || s.role !== "مشترك"){
    location.href = "register.html";
    return;
  }

  const sid = q("معرف");
  if(!sid){
    msg("err","معرف الجمعية غير موجود");
    return;
  }

  try{
    const data = await get("رغبات حالة", { token: s.token, معرف_الجمعية: sid });

    const soc = data.جمعية;
    const months = data.الاشهر || [];
    const shares = Number(data.عدد_اسهم_المشترك||0);

    setHtml("socInfo",
      "اسم الجمعية <b>" + esc(soc.اسم) + "</b><br>" +
      "تاريخ البداية <b>" + esc(soc.تاريخ_البداية) + "</b><br>" +
      "تاريخ النهاية <b>" + esc(soc.تاريخ_النهاية) + "</b><br>"
    );

    if(String(soc.حالة) !== "جديدة"){
      setHtml("prefBox", "<div class='warn warn-gray'>الرغبات متاحة فقط في جمعية جديدة</div>");
      document.getElementById("btnSave").style.display = "none";
      return;
    }

    if(data.موجودة){
      setHtml("prefBox", "<div class='warn warn-gray'>تم حفظ رغباتك مسبقا, لا يمكن التعديل</div>");
      document.getElementById("btnSave").style.display = "none";
      return;
    }

    setHtml("prefBox", buildTable(months, shares));
    setHtml("warnings", renderWarnings(data.ملخص || [], months));

    // تحذير اسفل الجدول حسب مجموع اسهم المشترك
    function updateTotalHint(){
      const sum = sumInputs(months.length);
      let hint = "";
      if(sum < shares) hint = "مجموع الاسهم المدخلة اقل من اسهمك";
      else if(sum > shares) hint = "مجموع الاسهم المدخلة اكثر من اسهمك";
      else hint = "توزيعك متوازن";
      setHtml("msg", `<div class="warn warn-gray">${esc(hint)} , مجموعك الحالي ${esc(sum)} من ${esc(shares)}</div>`);
    }

    for(let i=1;i<=months.length;i++){
      document.getElementById("m"+i).addEventListener("input", updateTotalHint);
      document.getElementById("t"+i).addEventListener("change", updateTotalHint);
    }
    updateTotalHint();

    document.getElementById("btnSave").onclick = async function(){
      try{
        const payload = { token:s.token, معرف_الجمعية: sid };
        for(let i=1;i<=months.length;i++){
          payload["شهر"+i] = round2(document.getElementById("m"+i).value);
          payload["نوع"+i] = document.getElementById("t"+i).value;
        }

        await get("حفظ الرغبات", payload);
        msg("ok","تم حفظ التعديلات بنجاح");
        setTimeout(()=> location.href = "member.html", 700);

      }catch(e){
        msg("err", e.message || String(e));
      }
    };

  }catch(e){
    msg("err", e.message || String(e));
  }
})();
