// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE CRUD + AUTH + STORAGE
// COMPLETE TREASURY MANAGEMENT SYSTEM
// =================================

import { db, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const auth = getAuth();
let currentUser = null;

// Helper para itago ang loader kapag ready na ang lahat
function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
}

// ===============================
// AUTH & DASHBOARD INITIALIZATION
// ===============================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Check kung nasa admins collection
    const adminDoc = await getDoc(doc(db, "admins", user.uid));

    if (!adminDoc.exists()) {
      alert("Access denied. You are not an authorized administrator.");
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }

    currentUser = user;

    const email = document.getElementById("adminEmail");
    if (email) {
      email.textContent = user.email;
    }

    // Load dashboard pagkatapos ma-verify ang admin
    await refresh();
  } catch (err) {
    console.error("Auth / Load Error:", err);
  } finally {
    // Siguraduhing mawawala ang loader pagkatapos ng Auth check at Data Fetching
    hideLoader();
  }
});

// ===============================
// LOGOUT
// ===============================

const logout = document.getElementById("logout");
if (logout) {
  logout.onclick = async () => {
    await signOut(auth);
    window.location.href = "login.html";
  };
}

// ===============================
// HELPERS
// ===============================

function peso(value) {
  return "₱" + Number(value || 0).toLocaleString();
}

function value(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function notify(msg) {
  alert(msg);
}

// ===============================
// AUDIT TRAIL
// ===============================

async function createAudit(action, details) {
  try {
    await addDoc(collection(db, "audit"), {
      action,
      details,
      user: currentUser?.email || "Admin",
      date: new Date().toLocaleString(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Audit error:", err);
  }
}

// ===============================
// COLLECTION ADD
// ===============================

const collectionForm = document.getElementById("collectionForm");
if (collectionForm) {
  collectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      let data = {
        year: value("yearLevel"),
        amount: Number(value("amount")),
        date: value("date"),
        type: "Collection",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "collections"), data);
      await createAudit("Added Collection", `${data.year} ${peso(data.amount)}`);

      notify("Collection Added!");
      collectionForm.reset();
      refresh();
    } catch (err) {
      console.error(err);
      notify("Collection failed");
    }
  });
}

// ===============================
// PROJECT ADD
// ===============================

const projectForm = document.getElementById("projectForm");
if (projectForm) {
  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      let data = {
        name: value("projectName"),
        budget: Number(value("projectBudget")),
        description: value("description"),
        status: "Planned",
        type: "Project",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "projects"), data);
      await createAudit("Added Project", data.name);

      notify("Project Added!");
      projectForm.reset();
      refresh();
    } catch (error) {
      console.error(error);
    }
  });
}

// ===============================
// EXPENSE ADD
// ===============================

const expenseForm = document.getElementById("expenseForm");
if (expenseForm) {
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      let fileInput = document.getElementById("receiptFile");
      let file = fileInput ? fileInput.files[0] : null;
      let receipt = "";

      if (file) {
        let location = ref(storage, "receipts/" + Date.now() + "_" + file.name);
        await uploadBytes(location, file);
        receipt = await getDownloadURL(location);
      }

      let data = {
        project: value("expenseProject"),
        amount: Number(value("expenseAmount")),
        description: value("expenseDescription"),
        receipt,
        status: "Approved",
        date: new Date().toLocaleDateString(),
        type: "Expense",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "expenses"), data);
      await createAudit("Added Expense", `${data.project} ${peso(data.amount)}`);

      notify("Expense Saved!");
      expenseForm.reset();
      refresh();
    } catch (error) {
      console.error(error);
      notify("Expense failed");
    }
  });
}

// ===============================
// RECEIPT PREVIEW
// ===============================

const receiptFile = document.getElementById("receiptFile");
if (receiptFile) {
  receiptFile.onchange = () => {
    let file = receiptFile.files[0];
    let preview = document.getElementById("receiptPreview");

    if (file && preview) {
      preview.innerHTML = `
        <img src="${URL.createObjectURL(file)}"
        width="200"
        style="border-radius:15px;margin-top:15px;">
      `;
    }
  };
}

// ===============================
// LOAD RECORDS
// ===============================

async function loadRecords() {
  let table = document.getElementById("records");
  if (!table) return;

  table.innerHTML = "";
  let all = [];

  let sources = [
    ["collections", "Collection"],
    ["projects", "Project"],
    ["expenses", "Expense"]
  ];

  for (let s of sources) {
    let snap = await getDocs(collection(db, s[0]));
    snap.forEach((item) => {
      let d = item.data();
      all.push({
        id: item.id,
        collection: s[0],
        type: s[1],
        title: d.name || d.year || d.project,
        details: d.description || d.date,
        amount: d.amount,
        receipt: d.receipt
      });
    });
  }

  updateStats(all);

  if (all.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="4">No records available.</td>
      </tr>
    `;
    return;
  }

  all.reverse();

  let rows = "";
  all.forEach((r) => {
    rows += `
      <tr>
        <td>${r.type}</td>
        <td>
          <b>${r.title || ""}</b>
          <br>
          ${r.details || ""}
          ${
            r.receipt
              ? `<br><a href="${r.receipt}" target="_blank">🧾 Receipt</a>`
              : ""
          }
        </td>
        <td>${peso(r.amount)}</td>
        <td>
          <button onclick="deleteRecord('${r.collection}','${r.id}')">
            🗑 Delete
          </button>
        </td>
      </tr>
    `;
  });
  table.innerHTML = rows;
}

// ===============================
// STATS
// ===============================

function updateStats(records) {
  let collectionCount = 0;
  let projectCount = 0;
  let expenseCount = 0;

  records.forEach((r) => {
    if (r.type == "Collection") collectionCount++;
    if (r.type == "Project") projectCount++;
    if (r.type == "Expense") expenseCount++;
  });

  const setSafeText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = text;
  };

  setSafeText("recordCount", records.length);
  setSafeText("collectionCount", collectionCount);
  setSafeText("projectCount", projectCount);
  setSafeText("expenseCount", expenseCount);
}

// ===============================
// AUDIT VIEW
// ===============================

async function loadAudit() {
  let box = document.getElementById("auditContainer");
  if (!box) return;

  box.innerHTML = "";
  let snap = await getDocs(collection(db, "audit"));
  let logs = [];

  snap.forEach((d) => {
    logs.push(d.data());
  });

  logs.reverse();

  let auditHTML = "";
  logs.forEach((log) => {
    auditHTML += `
      <div class="panel">
        <b>${log.action}</b>
        <p>${log.details}</p>
        <small>
          ${log.user}
          <br>
          ${log.date}
        </small>
      </div>
    `;
  });
  box.innerHTML = auditHTML;

  const auditCountEl = document.getElementById("auditCount");
  if (auditCountEl) {
    auditCountEl.innerHTML = logs.length;
  }
}

// ===============================
// DELETE
// ===============================

window.deleteRecord = async function (c, id) {
  if (!confirm("Delete this record?")) return;

  try {
    await deleteDoc(doc(db, c, id));
    await createAudit("Deleted Record", c + " " + id);
    notify("Deleted!");
    refresh();
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

// ===============================
// SEARCH
// ===============================

const search = document.getElementById("searchRecord");
if (search) {
  search.onkeyup = () => {
    let text = search.value.toLowerCase();
    document.querySelectorAll("#records tr").forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(text)
        ? ""
        : "none";
    });
  };
}

// ===============================
// REFRESH SYSTEM
// ===============================

async function refresh() {
  await loadRecords();
  await loadAudit();
}
