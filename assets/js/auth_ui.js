(function(){
  const s = جلسة();

  const navLogout = document.getElementById("navLogout");
  const navAdmin = document.getElementById("navAdmin");
  const navMember = document.getElementById("navMember");
  const navRegister = document.getElementById("navRegister");

  if(navLogout){
    navLogout.style.display = s.token ? "" : "none";
    navLogout.onclick = (e) => {
      e.preventDefault();
      خروج();
    };
  }

  if(navAdmin){
    navAdmin.style.display = (s.token && s.role === "مدير") ? "" : "none";
  }

  if(navMember){
    navMember.style.display = (s.token && s.role === "مشترك") ? "" : "none";
  }

  if(navRegister){
    navRegister.style.display = s.token ? "none" : "";
  }
})();
