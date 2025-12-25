(function(){
  const u = new URL(location.href);
  document.getElementById("sid").textContent = "معرف الجمعية " + (u.searchParams.get("معرف") || "");
})();
