let currentSociety = null;
let openMonthIndex = null;

function showSocieties(){
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("societyView").style.display = "";
  loadSocietyDemo();
}

function backToDashboard(){
  document.getElementById("societyView").style.display = "none";
  document.getElementById("dashboard").style.display = "";
}

function switchTab(tab){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  event.target.classList.add("active");

  document.getElementById("tab-months").style.display = tab==="months" ? "" : "none";
  document.getElementById("tab-collection").style.display = tab==="collection" ? "" : "none";
  document.getElementById("tab-delivery").style.display = tab==="delivery" ? "" : "none";
}

/* ===== عرض تجريبي (سيتم ربطه بالـ API لاحقا) ===== */

function loadSocietyDemo(){
  currentSociety = {
    name: "جمعية 1",
    start: "2026-01-01",
    months: 10,
    members: [
      {name:"محمد", shares:40, prefs:[0,0,0,0,0,0,5,0,15,20]},
      {name:"أحمد", shares:10, prefs:[0,0,0,0,0,0,0,5,5,0]}
    ]
  };

  document.getElementById("societyName").innerText = currentSociety.name;

  document.getElementById("societyInfo").innerHTML = `
    تاريخ البداية ${currentSociety.start}<br>
    عدد الأشهر ${currentSociety.months}
  `;

  buildMonths();
  buildCollection();
  buildDelivery();
}

function buildMonths(){
  const grid = document.getElementById("monthsGrid");
  grid.innerHTML = "";

  for(let i=0;i<currentSociety.months;i++){
    const totalShares = currentSociety.members.reduce((s,m)=>s+(m.prefs[i]||0),0);
    const amount = totalShares * 1000;

    const status = amount === 0 ? "month-normal" :
                   amount < 20000 ? "month-normal" :
                   amount < 30000 ? "month-near" :
                   amount < 40000 ? "month-limit" : "month-over";

    const card = document.createElement("div");
    card.className = `month-card ${status}`;
    card.innerHTML = `
      <h4>شهر ${i+1}</h4>
      إجمالي الأسهم ${totalShares}<br>
      قيمة التسليم ${amount}
    `;

    card.onclick = ()=>toggleAccordion(card,i,"prefs");
    grid.appendChild(card);
  }
}

function buildCollection(){
  const grid = document.getElementById("collectionGrid");
  grid.innerHTML = "";

  for(let i=0;i<currentSociety.months;i++){
    const card = document.createElement("div");
    card.className = "month-card month-normal";
    card.innerHTML = `<h4>شهر ${i+1}</h4>`;

    card.onclick = ()=>toggleAccordion(card,i,"collection");
    grid.appendChild(card);
  }
}

function buildDelivery(){
  const grid = document.getElementById("deliveryGrid");
  grid.innerHTML = "";

  for(let i=0;i<currentSociety.months;i++){
    const card = document.createElement("div");
    card.className = "month-card month-normal";
    card.innerHTML = `<h4>شهر ${i+1}</h4>`;

    card.onclick = ()=>toggleAccordion(card,i,"delivery");
    grid.appendChild(card);
  }
}

function toggleAccordion(card,index,type){
  const existing = card.querySelector(".accordion");
  if(existing){
    existing.remove();
    return;
  }

  const box = document.createElement("div");
  box.className = "accordion";

  if(type==="prefs"){
    currentSociety.members.forEach(m=>{
      if(m.prefs[index]>0){
        box.innerHTML += `
          <div class="row">
            <span>${m.name}</span>
            <span>${m.prefs[index]} سهم</span>
          </div>
        `;
      }
    });
  }

  if(type==="collection"){
    currentSociety.members.forEach(m=>{
      const amount = m.shares * 100;
      box.innerHTML += `
        <div class="row">
          <span>${m.name}</span>
          <span>${amount}</span>
          <input type="checkbox" class="checkbox">
        </div>
      `;
    });
  }

  if(type==="delivery"){
    currentSociety.members.forEach(m=>{
      if(m.prefs[index]>0){
        const amount = m.prefs[index] * 1000;
        box.innerHTML += `
          <div class="row">
            <span>${m.name}</span>
            <span>${amount}</span>
            <input type="checkbox" class="checkbox">
          </div>
        `;
      }
    });
  }

  card.appendChild(box);
}