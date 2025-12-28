function auth_ui(){
  const s = جلسة();

  const navMember = document.getElementById("navMember");
  const navAdmin = document.getElementById("navAdmin");
  const navLogout = document.getElementById("navLogout");

  if(navLogout){
    navLogout.style.display = s.token ? "" : "none";
    navLogout.onclick = function(e){
      e.preventDefault();
      خروج();
    };
  }

  if(navMember) navMember.style.display = (s.token && s.role === "مشترك") ? "" : "none";
  if(navAdmin) navAdmin.style.display = (s.token && s.role === "مدير") ? "" : "none";
}
