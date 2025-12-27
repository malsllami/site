(async function(){
  const s = جلسة();
  if(!s.token){
    location.href = "register.html";
    return;
  }

  const u = await get("معلومات مشترك",{ token:s.token });
  document.getElementById("info").innerText =
    u.الاسم + " - " + u.رقم_الجوال;

  const soc = await get("جمعيات المشترك",{ token:s.token });
  document.getElementById("societies").innerText =
    soc.map(x=>x.اسم).join(" , ");
})();
