function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

function toNum(x){
  const n = Number(String(x || "").trim() || 0);
  return isFinite(n) ? n : 0;
}

function monthLabelGregorian(yyyyMM){
  const s = String(yyyyMM || "").trim();
  const parts = s.split("-");
  if(parts.length !== 2) return s;

  const y = parts[0];
  const m = Number(parts[1]);

  const شهور = [
    "يناير","فبراير","مارس","ابريل","مايو","يونيو",
    "يوليو","اغسطس","سبتمبر","اكتوبر","نوفمبر","ديسمبر"
  ];

  if(m >= 1 && m <= 12) return شهور[m-1] + " " + y;
  return s;
}

function monthLabelHijriFromYYYYMM(yyyyMM){
  const s = String(yyyyMM || "").trim();
  const parts = s.split("-");
  if(parts.length !== 2) return "";

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if(!(y > 0 && m >= 1 && m <= 12)) return "";

  // اول يوم من الشهر الميلادي
  const d = new Date(y, m - 1, 1);

  try{
    // تقويم هجري, ar-SA-u-ca-islamic
    const fmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // نعرض "شهر سنة" فقط بدون اليوم
    const full = fmt.format(d); // مثال: ١ رمضان ١٤٤٧ هـ
    // حذف اليوم ان وجد, نأخذ اخر جزئين تقريبا, لكن بصيغة آمنة:
    // نعيد تنسيق الشهر والسنة مباشرة:
    const fmt2 = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      month: "long",
      year: "numeric"
    });
    return fmt2.format(d);
  }catch(e){
    return "";
  }
}

function renderSocInfo(s){
  return (
    "اسم الجمعية <b>" + esc(s.اسم) + "</b><br>" +
    "تاريخ البداية <b>" + esc(s.تاريخ_البداية) + "</b><br>" +
    "تاريخ النهاية <b>" + esc(s.تاريخ_النهاية) + "</b><br>" +
    "الحالة <b>" + esc(s.حالة) + "</b><br>" +
    "عدد المشتركين <b>" + esc(s.عدد_المشتركين) + "</b><br>" +
    "عدد الاسهم <b>" + esc(s.عدد_الاسهم) + "</b><br>" +
    "قيمة الجمعية الاجمالي <b>" + esc(s.اجمالي_القيمة) + "</b>"
  );
}

function renderJoinBoxForVisitor(){
  return `
    <div class="warn warn-gray">يلزم تسجيل الدخول للمتابعة</div>
    <div class="align-end">
      <a class="btn" href="register.html">الانتقال للتسجيل</a>
    </div>
  `;
}

function renderJoinBoxSubscribed(){
  return `<div class="warn warn-gray">انت مشترك مسبقا في هذه الجمعية</div>`;
}

function renderJoinBoxNewSociety(canJoin, currentShares){
  if(!canJoin){
    return `<div class="warn warn-gray">التسجيل متاح فقط في جمعية جديدة</div>`;
  }

  return `
    <div class="grid">
      <div class="col-12">
        <input id="shares" class="input" placeholder="عدد الاسهم مثل 1 او 0.5" value="${esc(currentShares || "")}">
        <div class="note">ملاحظة, يسمح بنصف سهم كحد ادنى</div>
      </div>
      <div class="col-12 align-end">
        <button id="btnJoin">حفظ وارسال</button>
      </div>
    </div>
  `;
}

function buildEventMapFromSummary(summary){
  const map = {};
  const arr = summary || [];
  for(const s of arr){
    const key = String(s.شهر || "").trim();
    const ev = String(s.مناسبة || "").trim();
    if(key) map[key] = ev;
  }
  return map;
}

function renderPrefSummary(months, prefObj, eventMap){
  const rows = [];
  for(let i=1;i<=months.length;i++){
    const val = toNum(prefObj["شهر " + i]);
    if(val > 0){
      const key = String(months[i-1] || "");
      rows.push({
        شهر_ميلادي: monthLabelGregorian(key),
        شهر_هجري: monthLabelHijriFromYYYYMM(key),
        مناسبة: String((eventMap && eventMap[key]) || "").trim(),
        اسهم: val
      });
    }
  }

  if(rows.length === 0){
    return `<div class="warn warn-gray">لم يتم اختيار رغبات بعد</div>`;
  }

  let html = `
    <table class="table">
      <tr>
        <th>الشهر الميلادي</th>
        <th>الشهر الهجري</th>
        <th>المناسبة</th>
        <th>عدد الاسهم</th>
      </tr>
  `;

  for(const r of rows){
    html += `
      <tr>
        <td>${esc(r.شهر_ميلادي)}</td>
        <td>${esc(r.شهر_هجري || "-")}</td>
        <td>${esc(r.مناسبة || "-")}</td>
        <td><b>${esc(r.اسهم)}</b></td>
      </tr>
    `;
  }

  const total = rows.reduce((s,x)=>s + toNum(x.اسهم), 0);

  html += `
      <tr>
        <th colspan="3">الاجمالي</th>
        <th>${esc(total)}</th>
      </tr>
    </table>
  `;
  return html;
}

(async function(){
  const sid = q("معرف");
  if(!sid){
    msg("err","معرف الجمعية غير موجود");
    return;
  }

  const s = جلسة();
  const isLogged = !!(s && s.token);
  const isMember = isLogged && s.role === "مشترك";
  const isAdmin = isLogged && s.role === "مدير";

  // القوائم حسب الجلسة
  if(isLogged){
    document.getElementById("logout").style.display = "";
  }
  if(isMember){
    document.getElementById("navMember").style.display = "";
    document.getElementById("navRegister").style.display = "none";
  }
  if(isAdmin){
    document.getElementById("navAdmin").style.display = "";
    document.getElementById("navRegister").style.display = "none";
  }

  document.getElementById("logout").addEventListener("click", function(e){
    e.preventDefault();
    خروج();
  });

  try{
    const details = await get("تفاصيل جمعية", { معرف_الجمعية: sid });
    const soc = details.جمعية;
    setHtml("socInfo", renderSocInfo(soc));

    // زائر
    if(!isLogged){
      setHtml("joinBox", renderJoinBoxForVisitor());
      return;
    }

    // مدير عرض فقط
    if(isAdmin){
      document.getElementById("joinCard").style.display = "none";
      document.getElementById("btnPrefs").style.display = "none";
      document.getElementById("prefCard").style.display = "none";
      return;
    }

    // مشترك
    const memberInfo = await get("تفاصيل جمعية للمشترك", { token: s.token, معرف_الجمعية: sid });
    const isSubscribed = !!memberInfo.مشترك_مسجل;

    // زر ادارة الرغبات يظهر فقط للمشترك داخل جمعية جديدة
    if(isSubscribed && String(soc.حالة) === "جديدة"){
      document.getElementById("btnPrefs").style.display = "";
      document.getElementById("btnPrefs").onclick = function(){
        location.href = "preferences.html?معرف=" + encodeURIComponent(sid);
      };
    }else{
      document.getElementById("btnPrefs").style.display = "none";
    }

    // صندوق الاشتراك
    if(isSubscribed){
      setHtml("joinBox", renderJoinBoxSubscribed());
    }else{
      setHtml("joinBox", renderJoinBoxNewSociety(String(soc.حالة) === "جديدة", ""));
      document.getElementById("btnJoin").onclick = async function(){
        try{
          const shares = document.getElementById("shares").value;
          await get("اشتراك جمعية", { token:s.token, معرف_الجمعية:sid, عدد_الاسهم:shares });
          msg("ok","تم التسجيل في الجمعية");
          setTimeout(()=> location.reload(), 700);
        }catch(e){
          msg("err", e.message || String(e));
        }
      };
    }

    // ملخص الرغبات للمشترك المشترك فقط
    if(isSubscribed){
      try{
        const prefState = await get("رغبات حالة", { token: s.token, معرف_الجمعية: sid });
        const months = prefState.الاشهر || [];
        const prefObj = prefState.رغبات || null;

        const eventMap = buildEventMapFromSummary(prefState.ملخص || []);

        document.getElementById("prefCard").style.display = "";
        if(prefObj){
          setHtml("prefSummary", renderPrefSummary(months, prefObj, eventMap));
        }else{
          setHtml("prefSummary", `<div class="warn warn-gray">لم يتم اختيار رغبات بعد</div>`);
        }

        // اذا ليست جديدة نخفي زر الادارة ونكتفي بالعرض
        if(String(soc.حالة) !== "جديدة"){
          document.getElementById("btnPrefs").style.display = "none";
        }

      }catch(e){
        document.getElementById("prefCard").style.display = "none";
      }
    }

  }catch(e){
    msg("err", e.message || String(e));
  }
})();
