(function(){
  const s = جلسة();
  if(s.token){
    location.href = (s.role === "مدير") ? "admin.html" : "member.html";
  }
})();

let _regBusy = false;
let _loginBusy = false;
let _lastPin = "";

function disable(id, on){
  const el = document.getElementById(id);
  if(!el) return;
  el.disabled = !!on;
  el.style.opacity = on ? "0.7" : "1";
  el.style.pointerEvents = on ? "none" : "auto";
}

async function register(){
  if(_regBusy) return;
  _regBusy = true;
  msg("", "");
  disable("btnRegister", true);

  try{
    const الاسم = document.getElementById("name").value.trim();
    const رقم_الجوال = document.getElementById("mobile").value.trim();

    const data = await post({ action: "تسجيل جديد", الاسم, رقم_الجوال });
    حفظ_جلسة(data.token, data.دور, data.الاسم);

    _lastPin = String(data.رمز || "").trim();
    document.getElementById("pinBox").style.display = "";
    document.getElementById("pinValue").textContent = _lastPin;
    document.getElementById("pinCopied").style.display = "none";
    document.getElementById("pinWarn").style.display = "";

    msg("ok", "تم التسجيل بنجاح");
  }catch(e){
    msg("err", e.message);
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
  document.getElementById("pinCopied").style.display = "";
  document.getElementById("pinWarn").style.display = "none";
  location.href = "member.html";
}

async function login(){
  if(_loginBusy) return;
  _loginBusy = true;
  msg("", "");
  disable("btnLogin", true);

  try{
    const رمز = document.getElementById("pin").value.trim();
    const data = await post({ action: "دخول بالرمز", رمز });
    حفظ_جلسة(data.token, data.دور, data.الاسم);
    location.href = (data.دور === "مدير") ? "admin.html" : "member.html";
  }catch(e){
    msg("err", e.message);
  }finally{
    disable("btnLogin", false);
    _loginBusy = false;
  }
}
