function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

function toNum(x){
  const n = Number(String(x || "").trim() || 0);
  return isFinite(n) ? n : 0;
}

function roundHalf(x){
  const n = toNum(x);
  return Math.round(n * 2) / 2;
}

function normalizeMonthKey(s){
  const v = String(s || "").trim();
  if(!v) return "";

  // يقبل 2026-01
  const m1 = v.match(/^(\d{4})-(\d{2})$/);
  if(m1) return m1[1] + "-" + m1[2];

  // يقبل 01-2026 ويحولها الى 2026-01
  const m2 = v.match(/^(\d{2})-(\d{4})$/);
  if(m2) return m2[2] + "-" + m2[1];

  // يقبل 2026-1 ويحولها 2026-01
  const m3 = v.match(/^(\d{4})-(\d{1})$/);
  if(m3) return m3[1] + "-0" + m3[2];

  return v;
}

function monthLabelGregorian(yyyyMM){
  const key = normalizeMonthKey(yyyyMM);
  const parts = key.split("-");
  if(parts.length !== 2) return key;

  const y = parts[0];
  const m = Number(parts[1]);

  const شهور = [
    "يناير","فبراير","مارس","ابريل","مايو","يونيو",
    "يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"
  ];

  if(m >= 1 && m <= 12) return شهور[m-1] + " " + y;
  return key;
}

function monthLabelHijriFromYYYYMM(yyyyMM){
  const key = normalizeMonthKey(yyyyMM);
  const parts = key.split("-");
  if(parts.length !== 2) return "";

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if(!(y > 0 && m >= 1 && m <= 12)) return "";

  const d = new Date(y, m - 1, 1);
  try{
    const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      month: "long",
      year: "numeric"
    });
    return fmt.format(d);
  }catch(e){
    return "";
  }
}

function buildEventMapFromSummary(summary){
  const map = {};
  const arr = summary || [];
  for(const s of arr){
    const rawKey = String(s.شهر || "").trim();
    const key = normalizeMonthKey(rawKey);
    const ev = String(s.مناسبة || "").trim();
    if(key) map[key] = ev;
  }
  return map;
}

function buildTable(months, eventMap){
  let html = `
    <div class="tableWrap">
      <table class="table">
        <tr>
          <th>الشهر</th>
          <th>الشهر الهجري</th>
          <th>المناسبة</th>
          <th>عدد الاسهم</th>
          <th>النوع</th>
        </tr>
  `;

  for(let i=0;i<months.length;i++){
    const raw = String(months[i] || "");
    const key = normalizeMonthKey(raw);

    const ميلادي = monthLabelGregorian(key);
    const هجري = monthLabelHijriFromYYYYMM(key);
    const مناسبة = String((eventMap && eventMap[key]) || "").trim();

    html += `
      <tr>
        <td>
          <div class="cellTitle">${esc(ميلادي)}</div>
          <div class="cellSub">${esc(key)}</div>
        </td>
        <td>${esc(هجري || "-")}</td>
        <td>${esc(مناسبة || "-")}</td>
        <td>
          <input class="input" inputmode="decimal" id="m${i+1}" value="0" placeholder="0 او 0.5 او 1">
        </td>
        <td>
          <select class="input" id="t${i+1}">
            <option value="قابل للتعديل">قابل للتعديل</option>
            <option value="ضروري">ضروري</option>
          </select>
        </td>
      </tr>
    `;
  }

  html += `
      </table>
    </div>
  `;

  return html;
}

function fillExisting(existing, monthCount){
  if(!existing) return;
  for(let i=1;i<=monthCount;i++){
    const v = existing["شهر " + i];
    const t = existing["نوع " + i];
    if(document.getElementById("m"+i)) document.getElementById("m"+i).value = String(v||0);
    if(document.getElementById("t"+i)) document.getElementById("t"+i).value = (String(t)==="ضروري") ? "ضروري" : "قابل للتعديل";
  }
}

function calcSum(monthCount){
  let sum = 0;
  for(let i=1;i<=monthCount;i++){
    sum += roundHalf(document.getElementById("m"+i).value);
  }
  return Math.round(sum * 2) / 2;
}

function setStatusMessage(sum, shares){
  let text = "";
  let cls = "warn-gray";

  if(sum < shares){
    text = "مجموع الاسهم المدخلة اقل من اسهمك";
    cls = "warn-orange";
  }else if(sum > shares){
    text = "مجموع الاسهم المدخلة اكثر من اسهمك";
    cls = "warn-red";
  }else{
    text = "توزيعك متوازن , مجموعك الحالي " + sum + " من " + shares;
    cls = "warn-green";
  }

  setHtml("msg", `<div class="warn ${cls}">${esc(text)}</div>`);
}

function renderWarnings(summary, months){
  const arr = summary || [];
  const rows = [];

  for(let i=0;i<arr.length;i++){
    const s = arr[i];
    const key = normalizeMonthKey(months[i] || "");
    const label = monthLabelGregorian(key);

    const نسبة = Number(s.نسبة || 0);
    const حالة = String(s.حالة || "");
    const مناسبة = String(s.مناسبة || "").trim();

    if(حالة === "تجاوز"){
      rows.push(`<div class="warn warn-red">تم تجاوز القدرة المتاحة للتسليم في شهر ${esc(label)}</div>`);
    }else if(حالة === "حد"){
      rows.push(`<div class="warn warn-orange">هذا الشهر قريب من الحد الاقصى للتسليم ${esc(label)}</div>`);
    }else if(نسبة >= 0.75){
      rows.push(`<div class="warn warn-orange">هذا الشهر عليه ضغط عالي ${esc(label)}</div>`);
    }

    if(مناسبة){
      rows.push(`<div class="warn warn-gray">هذا الشهر موسم مصاريف ${esc(مناسبة)}</div>`);
    }
  }

  return rows.length ? rows.join("") : `<div class="warn warn-gray">لا توجد تحذيرات</div>`;
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

  document.getElementById("logout").addEventListener("click", function(e){
    e.preventDefault();
    خروج();
  });

  try{
    const data = await get("رغبات حالة", { token: s.token, معرف_الجمعية: sid });

    const soc = data.جمعية;
    const months = (data.الاشهر || []).map(normalizeMonthKey);
    const shares = toNum(data.عدد_اسهم_المشترك);

    setHtml("socInfo",
      "اسم الجمعية <b>" + esc(soc.اسم) + "</b><br>" +
      "تاريخ البداية <b>" + esc(soc.تاريخ_البداية) + "</b><br>" +
      "تاريخ النهاية <b>" + esc(soc.تاريخ_النهاية) + "</b>"
    );

    if(String(soc.حالة) !== "جديدة"){
      setHtml("prefBox", "<div class='warn warn-gray'>الرغبات متاحة فقط في جمعية جديدة</div>");
      setHtml("msg", "");
      setHtml("warnings", "");
      document.getElementById("btnSave").style.display = "none";
      return;
    }

    const eventMap = buildEventMapFromSummary(data.ملخص || []);

    setHtml("prefBox", buildTable(months, eventMap));
    fillExisting(data.رغبات || null, months.length);

    setHtml("warnings", renderWarnings(data.ملخص || [], months));

    function refresh(){
      const sum = calcSum(months.length);
      setStatusMessage(sum, shares);
    }

    for(let i=1;i<=months.length;i++){
      document.getElementById("m"+i).addEventListener("input", refresh);
      document.getElementById("t"+i).addEventListener("change", refresh);
    }

    refresh();

    document.getElementById("btnSave").onclick = async function(){
      try{
        const sum = calcSum(months.length);
        if(sum !== shares){
          msg("err","لا يمكن حفظ التعديلات , مجموع الاسهم لا يطابق عدد اسهم المشترك");
          return;
        }

        const payload = { token:s.token, معرف_الجمعية: sid };
        for(let i=1;i<=months.length;i++){
          payload["شهر"+i] = roundHalf(document.getElementById("m"+i).value);
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
