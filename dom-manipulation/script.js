const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Mock API
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const formContainer = document.getElementById("formContainer");
const syncNotice = document.getElementById("syncNotice");

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Motivation" },
];

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate category dropdown
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastFilter = localStorage.getItem("selectedCategory");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
    filterQuotes();
  }
}

// Show a random quote
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex].text;
  quoteDisplay.textContent = `"${quote}"`;

  sessionStorage.setItem("lastViewedQuote", quote);
}

// Filter quotes
function filterQuotes() {
  localStorage.setItem("selectedCategory", categoryFilter.value);
  showRandomQuote();
}

// Add new quote form
function createAddQuoteForm() {
  const form = document.createElement("div");
  form.innerHTML = `
    <h2>Add a New Quote</h2>
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;
  formContainer.appendChild(form);
  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
}

// Add quote and post to server
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote); // ✅ Send to server
  alert("Quote added and synced to server!");
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// ✅ Post new quote to mock server (simulated)
async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quote.text,
        body: quote.category,
        userId: 1
      })
    });
  } catch (error) {
    console.error("Failed to post quote:", error);
  }
}

// ✅ Fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();

    // Simulate extracting quote objects
    return data.slice(0, 5).map(post => ({
      text: post.title,
      category: "ServerSync"
    }));
  } catch (error) {
    console.error("Fetch failed:", error);
    return [];
  }
}

// ✅ Sync quotes (with conflict resolution)
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localJSON = JSON.stringify(quotes);
  const serverJSON = JSON.stringify(serverQuotes);

  if (localJSON !== serverJSON) {
    const confirmed = confirm("Server data differs. Overwrite local data?");
    if (confirmed) {
      quotes = serverQuotes;
      saveQuotes();
      populateCategories();
      showSyncNotice("Local quotes replaced with server data.");
    } else {
      showSyncNotice("Conflict detected: kept local quotes.");
    }
  }
}

// ✅ Show sync notification
function showSyncNotice(message) {
  syncNotice.style.display = "block";
  syncNotice.textContent = message;
  setTimeout(() => {
    syncNotice.style.display = "none";
  }, 5000);
}

// ✅ Manual sync trigger
function manualSync() {
  syncQuotes();
}

// ✅ Export quotes
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ✅ Import quotes
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes.push(...imported);
        saveQuotes();
        populateCategories();
        alert("Quotes imported!");
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (err) {
      alert("Import error: " + err.message);
    }
  };
  reader.readAsText(event.target.files[0]);
}

// Load last viewed quote
function loadLastViewedQuote() {
  const last = sessionStorage.getItem("lastViewedQuote");
  if (last) quoteDisplay.textContent = `"${last}"`;
}

// ⏱ Auto sync every 30 seconds
setInterval(syncQuotes, 30000);

// 🔁 Init
newQuoteBtn.addEventListener("click", showRandomQuote);
populateCategories();
createAddQuoteForm();
loadLastViewedQuote();
