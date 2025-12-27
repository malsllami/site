function q(name){
  return new URLSearchParams(location.search).get(name) || "";
}

function toNum(x){
  const n = Number(String(x || "").trim() || 0);
  return isFinite(n) ? n : 0;
}

function normalizeMonthKey(s){
  const v = String(s || "").trim();
  if(!v) return "";

  const m1 = v.match(/^(\d{4})-(\d{2})$/);
  if(m1) return m1[1] + "-" + m1[2];

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

function renderSocInfo(s){
  return (
    `<div class="kv"><div class="k">اسم الجمعية</div><div class="v"><b>${esc(s.اسم)}</b></div></div>` +
    `<div class="kv"><div class="k">تاريخ البداية</div><div class="v"><b>${esc(s.تاريخ_البداية)}</b></div></div>` +
    `<div class="kv"><div class="k">تاريخ النهاية</div><div class="v"><b>${esc(s.تاريخ_النهاية)}</b></div></div>` +
    `<div class="kv"><div class="k">الحالة</div><div class="v"><b>${esc(s.حالة)}</b></div></div>` +
    `<div class="kv"><div class="k">عدد المشتركين</div><div class="v"><b>${esc(s.عدد_المشتركين)}</b></div></div>` +
    `<div class="kv"><div class="k">عدد الاسهم</div><div class="v"><b>${esc(s.عدد_الاسهم)}</b></div></div>` +
    `<div class="kv"><div class="k">قيمة الجمعية الاجمالي</div><div class="v"><b>${esc(s.اجمالي_القيمة)}</b></div></div>`
  );
}

function renderPrefSummary(months, prefObj){
  const rows = [];
  for(let i=1;i<=months.length;i++){
    const val = toNum(prefObj["شهر " + i]);
    if(val > 0){
      const key = normalizeMonthKey(months[i-1]);
      rows.push({
        شهر_ميلادي: monthLabelGregorian(key),
        شهر_هجري: monthLabelHijriFromYYYYMM(key),
        اسهم: val
      });
    }
  }

  if(rows.length === 0){
    return `<div class="warn warn-gray">لم يتم اختيار رغبات بعد</div>`;
  }

  let html = `
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>الشهر الميلادي</th>
            <th>الشهر الهجري</th>
            <th>عدد الاسهم</th>
          </tr>
        </thead>
        <tbody>
  `;

  for(const r of rows){
    html += `
      <tr>
        <td data-label="الشهر الميلادي">${esc(r.شهر_ميلادي)}</td>
        <td data-label="الشهر الهجري">${esc(r.شهر_هجري || "-")}</td>
        <td data-label="عدد الاسهم"><b>${esc(r.اسهم)}</b></td>
      </tr>
    `;
  }

  const total = rows.reduce((s,x)=>s + toNum(x.اسهم), 0);

  html += `
        <tr>
          <td data-label="الاجمالي" colspan="2"><b>الاجمالي</b></td>
          <td data-label="مجموع"><b>${esc(total)}</b></td>
        </tr>
        </tbody>
      </table>
    </div>
  `;

  return html;
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

function renderJoinBoxNewSociety(canJoin){
  if(!canJoin){
    return `<div class="warn warn-gray">التسجيل متاح فقط في جمعية جديدة</div>`;
  }

  return `
    <div class="grid">
      <div class="col-12">
        <input id="shares" class="input" placeholder="عدد الاسهم مثل 1 او 0.5">
        <div class="note">ملاحظة, يسمح بنصف سهم كحد ادنى</div>
      </div>
      <div class="col-12 align-end">
        <button id="btnJoin">حفظ وارسال</button>
      </div>
    </div>
  `;
}

function renderEditBox(currentShares){
  return `
    <div class="grid">
      <div class="col-12">
        <div class="warn warn-orange">تنبيه, تعديل عدد الأسهم مسموح فقط في جمعية جديدة, بعد التحول الى نشطة يمنع التعديل</div>
      </div>
      <div class="col-8">
        <input id="editShares" class="input" placeholder="عدد الاسهم الجديد" value="${esc(currentShares)}">
      </div>
      <div class="col-4">
        <button class="btn btn2" id="btnEditShares">تعديل</button>
      </div>
      <div class="col-12 align-end">
        <button class="btn" id="btnWithdraw" style="background:#b23b3b">انسحاب من الجمعية</button>
      </div>
    </div>
  `;
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

    if(!isLogged){
      setHtml("joinBox", renderJoinBoxForVisitor());
      return;
    }

    if(isAdmin){
      document.getElementById("joinCard").style.display = "none";
      document.getElementById("btnPrefs").style.display = "none";
      document.getElementById("prefCard").style.display = "none";
      document.getElementById("editCard").style.display = "none";
      return;
    }

    const memberInfo = await get("تفاصيل جمعية للمشترك", { token: s.token, معرف_الجمعية: sid });
    const isSubscribed = !!memberInfo.مشترك_مسجل;

    if(isSubscribed && String(soc.حالة) === "جديدة"){
      document.getElementById("btnPrefs").style.display = "";
      document.getElementById("btnPrefs").onclick = function(){
        location.href = "preferences.html?معرف=" + encodeURIComponent(sid);
      };
    }else{
      document.getElementById("btnPrefs").style.display = "none";
    }

    if(isSubscribed){
      setHtml("joinBox", renderJoinBoxSubscribed());
    }else{
      setHtml("joinBox", renderJoinBoxNewSociety(String(soc.حالة) === "جديدة"));
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

    if(isSubscribed){
      try{
        const prefState = await get("رغبات حالة", { token: s.token, معرف_الجمعية: sid });
        const months = (prefState.الاشهر || []).map(normalizeMonthKey);
        const prefObj = prefState.رغبات || null;

        document.getElementById("prefCard").style.display = "";
        if(prefObj){
          setHtml("prefSummary", renderPrefSummary(months, prefObj));
        }else{
          setHtml("prefSummary", `<div class="warn warn-gray">لم يتم اختيار رغبات بعد</div>`);
        }

        if(String(soc.حالة) !== "جديدة"){
          document.getElementById("btnPrefs").style.display = "none";
        }

      }catch(e){
        document.getElementById("prefCard").style.display = "none";
      }
    }

    // إدارة الاشتراك (تعديل أسهم, انسحاب) فقط إذا جمعية جديدة والمشترك مسجل
    if(isSubscribed && String(soc.حالة)==="جديدة"){
      document.getElementById("editCard").style.display = "";
      setHtml("editBox", renderEditBox(memberInfo.عدد_اسهم_المشترك || 0));

      document.getElementById("btnEditShares").onclick = async function(){
        try{
          const val = document.getElementById("editShares").value;
          await get("تعديل اشتراك جمعية", { token:s.token, معرف_الجمعية:sid, عدد_الاسهم:val });
          msg("ok","تم تعديل عدد الاسهم");
          setTimeout(()=> location.reload(), 700);
        }catch(e){
          msg("err", e.message || String(e));
        }
      };

      document.getElementById("btnWithdraw").onclick = async function(){
        if(!confirm("تأكيد الانسحاب من الجمعية؟")) return;
        try{
          await get("انسحاب جمعية", { token:s.token, معرف_الجمعية:sid });
          msg("ok","تم الانسحاب");
          setTimeout(()=> location.href="member.html", 700);
        }catch(e){
          msg("err", e.message || String(e));
        }
      };
    }else{
      document.getElementById("editCard").style.display = "none";
    }

  }catch(e){
    msg("err", e.message || String(e));
  }
})();
