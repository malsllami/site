document.getElementById("logout").addEventListener("click", function(e){
  e.preventDefault();
  خروج();
});

(async function(){
  const s = جلسة();
  if(!s.token || s.role!=="مشترك"){
    location.href="register.html";
    return;
  }

  try{
    const data = await get("معلومات مشترك", { token:s.token });
    const u = data.مستخدم;
    setHtml("info",
      "الاسم <b>" + esc(u.الاسم) + "</b><br>" +
      "رقم الجوال <b>" + esc(u.رقم_الجوال) + "</b>"
    );
  }catch(e){
    msg("err", e.message);
  }
})();
