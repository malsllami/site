(function(){
  const s = جلسة();
  const navLogout = document.getElementById("navLogout");
  const navAdmin = document.getElementById("navAdmin");
  const navMember = document.getElementById("navMember");

  if(navLogout){
    navLogout.style.display = s.token ? "" : "none";
    navLogout.onclick = (e) => {
      e.preventDefault();
      خروج();
    };
  }

  if(navAdmin) navAdmin.style.display = (s.role === "مدير") ? "" : "none";
  if(navMember) navMember.style.display = (s.role === "مشترك") ? "" : "none";
})();
