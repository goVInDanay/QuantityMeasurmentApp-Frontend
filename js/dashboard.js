const API_BASE = "http://localhost:8080/api";

// =======================
// 👤 USER
// =======================

async function loadUser() {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      // ❌ DON'T redirect
      document.getElementById("user").innerHTML = `
        <p>Guest User</p>
        <a href="index.html">Login to view history</a>
      `;
      return false;
    }

    const user = await res.json();

    document.getElementById("user").innerHTML = `
      <p>Name: ${user.name}</p>
      <p>Email: ${user.email}</p>
    `;

    return true; // ✅ logged in
  } catch (err) {
    console.error(err);
    return false;
  }
}

// =======================
// 🚪 LOGOUT
// =======================

async function logout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  window.location.href = "index.html";
}

// =======================
// 🔥 UNIT MAP (KEY FIX)
// =======================

const unitMap = {
  LengthUnit: ["FEET", "INCHES", "YARDS", "CENTIMETERS"],
  VolumeUnit: ["LITRE", "MILLILITRE", "GALLON"],
  WeightUnit: ["GRAM", "KILOGRAM", "MILLIGRAM", "POUND", "TONNE"],
  TemperatureUnit: ["CELSIUS", "FAHRENHEIT"],
};

// =======================
// 🎯 POPULATE UNITS
// =======================

function populateUnits(type) {
  const unit1 = document.getElementById("unit1");
  const unit2 = document.getElementById("unit2");

  unit1.innerHTML = "";
  unit2.innerHTML = "";

  if (!type || !unitMap[type]) return;

  unitMap[type].forEach((unit) => {
    const opt1 = document.createElement("option");
    const opt2 = document.createElement("option");

    opt1.value = unit;
    opt1.text = unit;

    opt2.value = unit;
    opt2.text = unit;

    unit1.appendChild(opt1);
    unit2.appendChild(opt2);
  });

  // Trigger convert after loading
  convert();
}

// =======================
// 🔥 VALIDATION
// =======================

function validateInput(value, unit) {
  if (value === "" || isNaN(value)) return "Enter valid number";
  if (!unit) return "Select a unit";
  return null;
}

// =======================
// ➕ ADD
// =======================

async function add() {
  const v1 = parseFloat(document.getElementById("value1").value);
  const v2 = parseFloat(document.getElementById("value2").value);
  const unit1 = document.getElementById("unit1").value;
  const unit2 = document.getElementById("unit2").value;
  const type = document.getElementById("measurementType").value;

  const body = {
    thisQuantity: {
      value: v1,
      unit: unit1,
      measurementType: type,
    },
    thatQuantity: {
      value: v2,
      unit: unit2,
      measurementType: type,
    },
  };

  const res = await fetch(`${API_BASE}/quantity/add`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  document.getElementById("result").innerText =
    `Result: ${data.value} ${data.unit}`;

  loadHistory();
}

// =======================
// ➖ SUBTRACT
// =======================

async function subtract() {
  const v1 = parseFloat(document.getElementById("value1").value);
  const v2 = parseFloat(document.getElementById("value2").value);
  const unit1 = document.getElementById("unit1").value;
  const unit2 = document.getElementById("unit2").value;
  const type = document.getElementById("measurementType").value;

  const res = await fetch(`${API_BASE}/quantity/subtract`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thisQuantity: {
        value: v1,
        unit: unit1,
        measurementType: type,
      },
      thatQuantity: {
        value: v2,
        unit: unit2,
        measurementType: type,
      },
    }),
  });

  const data = await res.json();

  document.getElementById("result").innerText =
    `Result: ${data.value} ${data.unit}`;

  loadHistory();
}

// =======================
// 🔁 CONVERT (FINAL FIX)
// =======================

async function convert() {
  const value = parseFloat(document.getElementById("value1").value);
  const sourceUnit = document.getElementById("unit1").value;
  const targetUnit = document.getElementById("unit2").value;
  const type = document.getElementById("measurementType").value;

  if (!type) return;

  const error = validateInput(value, sourceUnit);
  if (error) {
    document.getElementById("result").innerText = error;
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/quantity/convert?targetUnit=${targetUnit}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: value,
          unit: sourceUnit,
          measurementType: type, // ✅ FIXED
        }),
      },
    );

    if (!res.ok) {
      document.getElementById("result").innerText = "Conversion failed ❌";
      return;
    }

    const data = await res.json();

    document.getElementById("result").innerText =
      `Converted: ${data.value} ${data.unit}`;

    document.getElementById("value2").value = data.value;

    loadHistory();
  } catch (err) {
    console.error(err);
    document.getElementById("result").innerText = "Server error ❌";
  }
}

// =======================
// 📜 HISTORY
// =======================

async function loadHistory(isLoggedIn) {
  if (!isLoggedIn) {
    document.getElementById("historyList").innerHTML =
      "<li>🔒 Login to view history</li>";
    return;
  }

  const res = await fetch(`${API_BASE}/history`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) return;

  const data = await res.json();

  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  data.forEach((item) => {
    const li = document.createElement("li");

    li.innerText = item.error
      ? `❌ ${item.errorMessage}`
      : `${item.input} = ${item.result}`;

    historyList.appendChild(li);
  });
}

// =======================
// 🚀 EVENTS (AUTO CONVERT)
// =======================

document
  .getElementById("measurementType")
  .addEventListener("change", (e) => populateUnits(e.target.value));

document.getElementById("value1").addEventListener("input", convert);

document.getElementById("unit1").addEventListener("change", convert);

document.getElementById("unit2").addEventListener("change", convert);

// =======================
// 🚀 INIT
// =======================
async function init() {
  const isLoggedIn = await loadUser(); // check login
  loadHistory(isLoggedIn); // pass status
}

init();
