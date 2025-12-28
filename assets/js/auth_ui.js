function auth_ui(){
  const s = جلسة();

  const navHome = document.getElementById("navHome");
  const navRegister = document.getElementById("navRegister");
  const navMember = document.getElementById("navMember");
  const navAdmin = document.getElementById("navAdmin");
  const navLogout = document.getElementById("navLogout");

  if(!s.token){
    if(navRegister) navRegister.style.display = "";
    if(navMember) navMember.style.display = "none";
    if(navAdmin) navAdmin.style.display = "none";
    if(navLogout) navLogout.style.display = "none";
    return;
  }

  if(navLogout) navLogout.style.display = "";
  if(navRegister) navRegister.style.display = "none";

  if(s.role === "مدير"){
    if(navAdmin) navAdmin.style.display = "";
    if(navMember) navMember.style.display = "none";
  }else{
    if(navMember) navMember.style.display = "";
    if(navAdmin) navAdmin.style.display = "none";
  }

  if(navLogout && !navLogout.__bound){
    navLogout.__bound = true;
    navLogout.addEventListener("click", function(e){
      e.preventDefault();
      خروج();
    });
  }
}
