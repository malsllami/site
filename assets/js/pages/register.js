(function(){
  const s = جلسة();
  if(s.token){
    if(s.role === "مدير") location.href = "admin.html";
    else location.href = "member.html";
    return;
  }
})();

let _regBusy = false;
let _loginBusy = false;
let _lastPin = "";

function disable(el, on){
  const e = document.getElementById(el);
  if(!e) return;
  e.disabled = !!on;
  e.style.opacity = on ? "0.7" : "1";
  e.style.pointerEvents = on ? "none" : "auto";
}

async function register(){
  if(_regBusy) return;
  _regBusy = true;

  msg("", "");
  disable("btnRegister", true);

  try{
    const الاسم = (document.getElementById("name").value || "").trim();
    const رقم_الجوال = (document.getElementById("mobile").value || "").trim();

    const data = await post({ action:"تسجيل جديد", الاسم, رقم_الجوال });

    حفظ_جلسة(data.token, "مشترك", data.الاسم || الاسم || "");

    _lastPin = String(data.رمز || "").trim();

    const box = document.getElementById("pinBox");
    const v = document.getElementById("pinValue");
    const copied = document.getElementById("pinCopied");
    const warn = document.getElementById("pinWarn");

    if(box) box.style.display = "";
    if(v) v.textContent = _lastPin;
    if(copied) copied.style.display = "none";
    if(warn) warn.style.display = "";

    msg("ok", "تم التسجيل بنجاح, انسخ رمز PIN قبل الانتقال");

  }catch(e){
    msg("err", e.message || String(e));
  }finally{
    disable("btnRegister", false);
    _regBusy = false;
  }
}

async function copyPin(){
  if(!_lastPin) return;

  try{
    await navigator.clipboard.writeText(_lastPin);
  }catch(e){
    const t = document.createElement("textarea");
    t.value = _lastPin;
    document.body.appendChild(t);
    t.select();
    try{ document.execCommand("copy"); }catch(_e){}
    t.remove();
  }

  const copied = document.getElementById("pinCopied");
  const warn = document.getElementById("pinWarn");
  if(copied) copied.style.display = "";
  if(warn) warn.style.display = "none";

  msg("ok", "تم نسخ الرمز, سيتم نقلك لصفحتك");
  setTimeout(() => location.href = "member.html", 700);
}

async function login(){
  if(_loginBusy) return;
  _loginBusy = true;

  msg("", "");
  disable("btnLogin", true);

  try{
    const رمز = (document.getElementById("pin").value || "").trim();
    if(!رمز){
      msg("err", "رمز PIN مطلوب");
      return;
    }

    const data = await post({ action:"دخول بالرمز", رمز });

    حفظ_جلسة(data.token, data.دور || "", data.الاسم || "");

    if(String(data.دور) === "مدير"){
      location.href = "admin.html";
    }else{
      location.href = "member.html";
    }

  }catch(e){
    msg("err", e.message || String(e));
  }finally{
    disable("btnLogin", false);
    _loginBusy = false;
  }
}
