(async function(){
  const s = جلسة();
  if(!s.token || s.role !== "مشترك"){
    location.href = "register.html";
    return;
  }

  try{
    // بيانات المشترك
    const data = await get("معلومات مشترك", { token: s.token });
    const u = data.مستخدم;
    setHtml("info",
      "الاسم <b>" + esc(u.الاسم) + "</b><br>" +
      "رقم الجوال <b>" + esc(u.رقم_الجوال) + "</b>"
    );

    // جمعيات المشترك
    const data2 = await get("جمعيات المشترك", { token: s.token });
    const arr = data2.اشتراكات || [];

    if(!arr.length){
      setHtml("mySocieties", "لا توجد جمعيات مشترك بها");
      return;
    }

    setHtml("mySocieties", `
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">اسم الجمعية</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">الحالة</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">عدد الاسهم</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">بداية</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">نهاية</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">فتح</th>
        </tr>
        ${arr.map(x=>`
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${esc(x.اسم_الجمعية)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${esc(x.حالة)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee"><b>${esc(x.عدد_الاسهم)}</b></td>
            <td style="padding:8px;border-bottom:1px solid #eee">${esc(x.تاريخ_البداية||"")}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">${esc(x.تاريخ_النهاية||"")}</td>
            <td style="padding:8px;border-bottom:1px solid #eee">
              <button class="btn btn2" onclick="location.href='society.html?معرف=${encodeURIComponent(x.معرف_الجمعية)}'">فتح</button>
            </td>
          </tr>
        `).join("")}
      </table>
    `);

  }catch(e){
    msg("err", e.message);
  }
})();
