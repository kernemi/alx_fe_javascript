const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Simulated API
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const formContainer = document.getElementById("formContainer");
const syncNotice = document.getElementById("syncNotice");

// Load from localStorage or default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Motivation" },
];

// Save quotes
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate categories
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

// Show quote
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

// Create form
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

// Add quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert("Quote added successfully!");
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// Export quotes
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        throw new Error("Invalid format");
      }
    } catch (err) {
      alert("Error importing JSON: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Load last viewed quote
function loadLastViewedQuote() {
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    quoteDisplay.textContent = `"${lastQuote}"`;
  }
}

// Manual sync
function manualSync() {
  fetchFromServer();
}

// Periodic server sync
setInterval(fetchFromServer, 30000);

// Fetch and sync
async function fetchFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "ServerSync"
    }));

    const localJSON = JSON.stringify(quotes);
    const serverJSON = JSON.stringify(serverQuotes);

    if (localJSON !== serverJSON) {
      const confirmed = confirm("New data found on server. Overwrite local data?");
      if (confirmed) {
        quotes = serverQuotes;
        saveQuotes();
        populateCategories();
        showSyncNotice("Local data overwritten with server data.");
      } else {
        showSyncNotice("Conflict detected: Local data kept.");
      }
    }
  } catch (err) {
    console.error("Failed to fetch from server:", err);
  }
}

// Show sync notice
function showSyncNotice(message) {
  syncNotice.style.display = "block";
  syncNotice.textContent = message;
  setTimeout(() => {
    syncNotice.style.display = "none";
  }, 5000);
}

// Event listeners and init
newQuoteBtn.addEventListener("click", showRandomQuote);
populateCategories();
createAddQuoteForm();
loadLastViewedQuote();
