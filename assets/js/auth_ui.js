(function(){
  // لازم ui.js يكون محمل قبل هذا الملف لأن جلسة() موجودة هناك
  const s = جلسة();

  const navRegister = document.getElementById("navRegister");
  const navMember = document.getElementById("navMember");
  const navAdmin = document.getElementById("navAdmin");
  const navLogout = document.getElementById("navLogout");

  function hide(el){ if(el) el.style.display = "none"; }
  function show(el){ if(el) el.style.display = ""; }

  if(s && s.token){
    // مسجل دخول
    hide(navRegister);
    show(navLogout);

    if(s.role === "مشترك"){
      show(navMember);
      hide(navAdmin);
    }else if(s.role === "مدير"){
      hide(navMember);
      show(navAdmin);
    }else{
      // احتياط
      show(navMember);
      show(navAdmin);
    }

    if(navLogout){
      navLogout.onclick = function(e){
        e.preventDefault();
        خروج();
      };
    }
  }else{
    // غير مسجل
    show(navRegister);
    hide(navLogout);
    show(navMember);
    show(navAdmin);
  }
})();
