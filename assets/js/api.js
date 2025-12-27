function jsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    const url = new URL(CONFIG.API_URL);

    url.searchParams.set("action", action);
    url.searchParams.set("callback", cb);

    for (const k in params) url.searchParams.set(k, params[k]);

    const s = document.createElement("script");

    window[cb] = (res) => {
      delete window[cb];
      s.remove();
      if(!res || !res.ok) reject(new Error(res.error || "خطأ"));
      else resolve(res.data);
    };

    s.onerror = () => {
      delete window[cb];
      s.remove();
      reject(new Error("فشل الاتصال"));
    };

    s.src = url.toString();
    document.body.appendChild(s);
  });
}

function get(action, params){
  return jsonp(action, params);
}

function post(body){
  const { action, ...params } = body;
  return jsonp(action, params);
}

function حفظ_جلسة(token, role){
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

function جلسة(){
  return {
    token: localStorage.getItem("token") || "",
    role: localStorage.getItem("role") || ""
  };
}

function خروج(){
  localStorage.clear();
  location.href = "register.html";
}
