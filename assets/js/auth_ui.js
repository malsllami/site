(function(){
  const s = جلسة()
  const logged = !!s.token
  const isAdmin = s.role === "مدير"

  const navRegister = document.getElementById("navRegister")
  const navMember = document.getElementById("navMember")
  const navAdmin = document.getElementById("navAdmin")
  const navLogout = document.getElementById("navLogout")

  if(navRegister) navRegister.style.display = logged ? "none" : ""
  if(navMember) navMember.style.display = logged && !isAdmin ? "" : "none"
  if(navAdmin) navAdmin.style.display = logged && isAdmin ? "" : "none"
  if(navLogout) navLogout.style.display = logged ? "" : "none"

  if(navLogout){
    navLogout.onclick = function(e){
      e.preventDefault()
      خروج()
    }
  }
})()
