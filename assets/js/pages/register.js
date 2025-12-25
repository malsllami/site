async function register(){
  msg("", "");

  try{
    const الاسم = document.getElementById("name").value.trim();
    const رقم_الجوال = document.getElementById("mobile").value.trim();

    const data = await post({ action:"تسجيل جديد", الاسم, رقم_الجوال });

    حفظ_جلسة(data.token, "مشترك");

    document.getElementById("newpin").innerHTML =
      "رمز PIN الخاص بك هو " + "<span style='color:#a11757'>" + esc(data.رمز) + "</span>";

    msg("ok", "تم التسجيل بنجاح");
    setTimeout(()=>location.href="member.html", 700);
  }catch(e){
    msg("err", e.message);
  }
}

async function login(){
  msg("", "");

  try{
    const رمز = document.getElementById("pin").value.trim();
    const data = await post({ action:"دخول بالرمز", رمز });

    حفظ_جلسة(data.token, data.دور);

    location.href = (data.دور==="مدير") ? "admin.html" : "member.html";
  }catch(e){
    msg("err", e.message);
  }
}
