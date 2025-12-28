function jsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    const url = new URL(CONFIG.API_URL);

    url.searchParams.set("action", action);
    url.searchParams.set("callback", cb);

    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("انتهت مهلة الاتصال"));
    }, 15000);

    function cleanup() {
      clearTimeout(timer);
      try { delete window[cb]; } catch (e) {}
      script.remove();
    }

    window[cb] = (response) => {
      cleanup();
      if (!response || response.ok !== true) {
        reject(new Error(response && response.error ? response.error : "خطأ غير معروف"));
        return;
      }
      resolve(response.data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("فشل الاتصال بالخدمة"));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function get(action, params = {}) {
  return await jsonp(action, params);
}

async function post(body) {
  const action = body.action;
  const params = { ...body };
  delete params.action;
  return await jsonp(action, params);
}

function حفظ_جلسة(token, role, name) {
  localStorage.setItem("token", String(token || "").trim());
  localStorage.setItem("role", String(role || "").trim());
  if (name != null) localStorage.setItem("name", String(name || "").trim());
}

function جلسة() {
  return {
    token: localStorage.getItem("token") || "",
    role: localStorage.getItem("role") || "",
    name: localStorage.getItem("name") || ""
  };
}

function خروج() {
  localStorage.clear();
  location.href = "register.html";
}
