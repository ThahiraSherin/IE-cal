let entries = [];
const mockAPI = 'https://684dd3c065ed0871391734f3.mockapi.io/IncomeExpensesCalculator';

function createEntry(type, description = "", amount = "") {
  const div = document.createElement("div");
  div.className = "entry flex space-x-2 mb-2";
  div.innerHTML = `
    <input type="text" placeholder="Description" value="${description}" class="border p-1 flex-1">
    <input type="number" placeholder="Amount" value="${amount}" class="border p-1 w-28">
  `;
  div.dataset.type = type;
  return div;
}

function addIncome() {
  document.getElementById("income-list").appendChild(createEntry("income"));
}

function addExpense() {
  document.getElementById("expense-list").appendChild(createEntry("expense"));
}

function getEntriesFromDOM(Id, type) {
  const container = document.getElementById(Id);
  const entries = [];
  container.querySelectorAll(".entry").forEach(div => {
    const [desc, amt] = div.querySelectorAll("input");
    const description = desc.value.trim();
    const amount = parseFloat(amt.value);
    if (description && !isNaN(amount)) {
      entries.push({ description, amount, type });
    }
  });
  return entries;
}

function updateUI(totalIncome, totalExpenses, balance) {
  document.getElementById("total-income").innerText = `₹${totalIncome}`;
  document.getElementById("total-expense").innerText = `₹${totalExpenses}`;
  document.getElementById("balance").innerText = `₹${balance}`;
}

function resetForm() {
  document.getElementById("income-list").innerHTML = "";
  document.getElementById("expense-list").innerHTML = "";
  updateUI(0, 0, 0);
}

function submitData() {
  const income = getEntriesFromDOM("income-list", "income");
  const expense = getEntriesFromDOM("expense-list", "expense");
  const all = [...income, ...expense];

  const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expense.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const data = {
    income,
    expense,
    totalIncome,
    totalExpenses,
    balance
  };

  localStorage.setItem("entries", JSON.stringify(all));
  updateUI(totalIncome, totalExpenses, balance);

  fetch(mockAPI, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(() => {
      alert("Submitted successfully!");
      fetchRecords();
    })
    .catch(err => alert("Error submitting: " + err));
}

function displayRecords(records) {
  const container = document.getElementById("record-list");
  container.innerHTML = "";
  records.forEach(record => {
  console.log("Record from API:", record); 
    const div = document.createElement("div");
    div.className = "record-card border p-2 rounded bg-white shadow";
    div.innerHTML = `
      <p><strong>Total Income:</strong> ₹${record.totalIncome}</p>
      <p><strong>Total Expenses:</strong> ₹${record.totalExpenses}</p>
      <p><strong>Balance:</strong> ₹${record.balance}</p>
      <div class="space-x-2 mt-2">
        <button onclick="deleteRecord('${record.Id}')" class="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
        <button onclick='loadRecord(${JSON.stringify(record)})' class="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function fetchRecords() {
  fetch(mockAPI)
    .then(res => res.json())
    .then(displayRecords)
    .catch(err => console.error("Error fetching records:", err));
}

function deleteRecord(Id) {
  if (!Id) {
    alert("Invalid record ID!");
    return;
  }

  fetch(`${mockAPI}/${Id}`, {
    method: "DELETE"
  })
  .then(async res => {
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete: ${res.status} - ${errorText}`);
    }
    return res.json();
  })
  .then(() => {
    alert("Record deleted.");
    fetchRecords();
  })
  .catch(err => console.error("Delete Error:", err));
}

function loadRecord(record) {
  alert(`Now editing this record:\n\nTotal Income: ₹${record.totalIncome}\nTotal Expenses: ₹${record.totalExpenses}\nBalance: ₹${record.balance}\n\nYou can now update this record.`);

  resetForm();

  (record.income || []).forEach(entry => {
    document.getElementById("income-list").appendChild(createEntry("income", entry.description, entry.amount));
  });

  (record.expense || []).forEach(entry => {
    document.getElementById("expense-list").appendChild(createEntry("expense", entry.description, entry.amount));
  });

  updateUI(record.totalIncome, record.totalExpenses, record.balance);

  // Optionally store the record ID for update reference
  editingRecordId = record.Id;
}


document.querySelectorAll('input[name="type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const type = document.querySelector('input[name="type"]:checked').value;
    const all = JSON.parse(localStorage.getItem("entries")) || [];
    const filtered = type === 'all' ? all : all.filter(e => e.type === type);
    displayFilteredEntries(filtered);
  });
});

function displayFilteredEntries(entries) {
  const container = document.getElementById("record-list");
  container.innerHTML = "";
  entries.forEach(entry => {
    const div = document.createElement("div");
    div.className = "record-card bg-white shadow p-2 rounded mb-2";
    div.innerHTML = `
      <p><strong>${entry.type.toUpperCase()}</strong>: ${entry.description} - ₹${entry.amount}</p>
    `;
    container.appendChild(div);
  });
}

window.onload = () => {
  fetchRecords();
};
