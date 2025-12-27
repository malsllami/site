async function register(){
  const الاسم = name.value.trim();
  const رقم_الجوال = mobile.value.trim();

  const data = await post({
    action:"تسجيل جديد",
    الاسم,
    رقم_الجوال
  });

  حفظ_جلسة(data.token, data.دور);
  alert("رمزك " + data.رمز);
  location.href = "member.html";
}

async function login(){
  const رمز = pin.value.trim();
  const data = await post({
    action:"دخول بالرمز",
    رمز
  });

  حفظ_جلسة(data.token, data.دور);
  location.href = "member.html";
}
