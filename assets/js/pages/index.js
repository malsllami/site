(function(){
  const s = جلسة();
  if(!s.token){
    location.href = "register.html";
    return;
  }
  if(s.role === "مدير") location.href = "admin.html";
  else location.href = "member.html";
})();
