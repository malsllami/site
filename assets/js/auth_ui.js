(function(){
  const s = جلسة();

  const navHome = document.getElementById("navHome");
  const navRole = document.getElementById("navRole");

  const navLogin = document.getElementById("navLogin");
  const navLogout = document.getElementById("navLogout");
  const navContact = document.getElementById("navContact");

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  function hide(el){ if(el) el.style.display = "none"; }
  function show(el){ if(el) el.style.display = ""; }

  function setRoleLink(){
    if(!navRole) return;

    if(s && s.token && s.role === "مدير"){
      navRole.textContent = "المدير";
      navRole.href = "admin.html";
      show(navRole);
      return;
    }

    if(s && s.token && s.role === "مشترك"){
      const nm = (s.name || "").trim();
      navRole.textContent = nm ? ("صفحتي " + nm) : "صفحتي";
      navRole.href = "member.html";
      show(navRole);
      return;
    }

    hide(navRole);
  }

  function applyTheme(){
    const b = document.body;
    if(!b) return;

    b.classList.remove("visitor-theme","member-theme","admin-theme");

    if(s && s.token && s.role === "مدير") b.classList.add("admin-theme");
    else if(s && s.token && s.role === "مشترك") b.classList.add("member-theme");
    else b.classList.add("visitor-theme");
  }

  function buildMobileMenu(){
    if(!mobileMenu) return;

    const links = [];

    links.push({ text:"الرئيسية", href:"index.html" });

    if(s && s.token && s.role === "مدير"){
      links.push({ text:"المدير", href:"admin.html" });
    }else if(s && s.token && s.role === "مشترك"){
      const nm = (s.name || "").trim();
      links.push({ text: nm ? ("صفحتي " + nm) : "صفحتي", href:"member.html" });
    }

    if(s && s.token){
      links.push({ text:"خروج", href:"#", id:"mLogout" });
    }else{
      links.push({ text:"تسجيل الدخول", href:"register.html" });
    }

    links.push({ text:"التواصل", href:"contact.html" });

    mobileMenu.innerHTML = links.map(x=>{
      const idAttr = x.id ? `id="${x.id}"` : "";
      return `<a class="mLink" ${idAttr} href="${x.href}">${x.text}</a>`;
    }).join("");

    const mLogout = document.getElementById("mLogout");
    if(mLogout){
      mLogout.onclick = function(e){
        e.preventDefault();
        خروج();
      };
    }
  }

  function setupDesktopLinks(){
    setRoleLink();

    if(s && s.token){
      hide(navLogin);
      show(navLogout);
      if(navLogout){
        navLogout.onclick = function(e){
          e.preventDefault();
          خروج();
        };
      }
    }else{
      show(navLogin);
      hide(navLogout);
    }
  }

  function setupMobileToggle(){
    if(!menuBtn || !mobileMenu) return;

    menuBtn.onclick = function(){
      const open = mobileMenu.style.display !== "none";
      mobileMenu.style.display = open ? "none" : "";
    };

    document.addEventListener("click", function(e){
      if(!mobileMenu || mobileMenu.style.display === "none") return;
      if(e.target === menuBtn) return;
      if(mobileMenu.contains(e.target)) return;
      mobileMenu.style.display = "none";
    });
  }

  applyTheme();
  setupDesktopLinks();
  buildMobileMenu();
  setupMobileToggle();
})();
