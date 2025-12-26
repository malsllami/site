function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

function toNum(x){
  const n = Number(String(x || "").trim() || 0);
  return isFinite(n) ? n : 0;
}

function monthLabel(yyyyMM){
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

function renderPrefSummary(months, prefObj){
  const rows = [];
  for(let i=1;i<=months.length;i++){
    const val = toNum(prefObj["شهر " + i]);
    if(val > 0){
      rows.push({
        شهر: monthLabel(months[i-1]),
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
        <th>الشهر</th>
        <th>عدد الاسهم</th>
      </tr>
  `;

  for(const r of rows){
    html += `
      <tr>
        <td>${esc(r.شهر)}</td>
        <td><b>${esc(r.اسهم)}</b></td>
      </tr>
    `;
  }

  const total = rows.reduce((s,x)=>s + toNum(x.اسهم), 0);

  html += `
      <tr>
        <th>الاجمالي</th>
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

  // اظهار واخفاء القوائم حسب الجلسة
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
    // جلب تفاصيل الجمعية العامة
    const details = await get("تفاصيل جمعية", { معرف_الجمعية: sid });
    const soc = details.جمعية;

    setHtml("socInfo", renderSocInfo(soc));

    // الزائر
    if(!isLogged){
      setHtml("joinBox", renderJoinBoxForVisitor());
      return;
    }

    // المدير يشاهد فقط
    if(isAdmin){
      document.getElementById("joinCard").style.display = "none";
      document.getElementById("btnPrefs").style.display = "none";
      document.getElementById("prefCard").style.display = "none";
      return;
    }

    // المشترك
    const memberInfo = await get("تفاصيل جمعية للمشترك", { token: s.token, معرف_الجمعية: sid });

    const isSubscribed = !!memberInfo.مشترك_مسجل;
    const myShares = toNum(memberInfo.عدد_اسهم_المشترك);

    // زر الرغبات يظهر فقط اذا مشترك وحالة جديدة
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

    // ملخص الرغبات, يظهر فقط للمشترك المشترك في الجمعية
    if(isSubscribed){
      try{
        const prefState = await get("رغبات حالة", { token: s.token, معرف_الجمعية: sid });
        const months = prefState.الاشهر || [];
        const prefObj = prefState.رغبات || null;

        if(prefObj){
          document.getElementById("prefCard").style.display = "";
          setHtml("prefSummary", renderPrefSummary(months, prefObj));
        }else{
          document.getElementById("prefCard").style.display = "";
          setHtml("prefSummary", `<div class="warn warn-gray">لم يتم اختيار رغبات بعد</div>`);
        }

        // اذا الجمعية ليست جديدة, نخفي زر الادارة ونكتفي بالعرض
        if(String(soc.حالة) !== "جديدة"){
          document.getElementById("btnPrefs").style.display = "none";
        }

      }catch(e){
        // لا نوقف الصفحة اذا فشل, فقط اخفاء الملخص
        document.getElementById("prefCard").style.display = "none";
      }
    }

  }catch(e){
    msg("err", e.message || String(e));
  }
})();
