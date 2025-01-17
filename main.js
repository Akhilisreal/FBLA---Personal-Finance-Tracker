let transactions = [];
let currentBalance = 0;
const tableBody = document.getElementById('transactionTable');
const balanceElement = document.getElementById('balance');
const chartCanvas = document.getElementById('summaryChart');
let chart;

//Starting Balance Function
function setStartingBalance() {
    const startingBalance = parseFloat(document.getElementById('startingBalance').value);

    //If starting Balance is not Entered, Window Alert will come
    if (isNaN(startingBalance) || startingBalance < 0) {
      alert('Please enter a valid starting balance.');
      return;
    }
  
    //Updating Current Balance
    currentBalance = startingBalance;
    updateBalance();

    //Disabling Starting Balance Input and Button
    document.getElementById('startingBalance').disabled = true;
    document.querySelector('.balance-setup button').disabled = true;
    console.log("Starting Balance entered, disabling starting balance features.")
  
    //Updating Graph
    updateChart();
  }

//Function for adding transactions
function addTransaction() {
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  //If user hasn't some information they will be alerted
  if (!category || !amount || !date) {
    alert('Please fill out all fields.');
    return;
  }

  //Adding Transaction information to transaction array
  const transaction = { type, category, amount, date };
  transactions.push(transaction);

  if (type === 'Income') currentBalance += amount;
  if (type === 'Expense') currentBalance -= amount;

  //clearing inputs
  document.getElementById('category').value = " ";
  document.getElementById('amount').value = " ";
  document.getElementById('date').value = " ";

  //These Function Created Below
  updateBalance();
  updateTable();
  updateChart();
}

//Updating Current Balance
function updateBalance() {
    balanceElement.innerText = `Current Balance: $${currentBalance.toFixed(2)}`;
  }

//Updating Table of Transactions
function updateTable() {
  tableBody.innerHTML = '';
  transactions.forEach((transaction, index) => {

    //creating new row for new transaction
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.type}</td>
      <td>${transaction.category}</td>
      <td>${transaction.amount}</td>
      <td>${transaction.date}</td>
      <td>
        <button onclick="deleteTransaction(${index})">Delete</button>
        <button id = "editButton" onclick="editTransaction(${index})">Edit</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

//Function for Deleting Transactions
function deleteTransaction(index) {
  const transaction = transactions[index];
  if (transaction.type === 'Income') currentBalance -= transaction.amount;
  if (transaction.type === 'Expense') currentBalance += transaction.amount;

  transactions.splice(index, 1);
  updateBalance();
  updateTable();
  updateChart();
}

//function for editing trancsaction
function editTransaction(index) {
  const transaction = transactions[index];

  document.getElementById('type').value = transaction.type;
  document.getElementById('category').value = transaction.category;
  document.getElementById('amount').value = transaction.amount;
  document.getElementById('date').value = transaction.date;

  deleteTransaction(index);
}

//function for searching transaction
function filterTransactions() {
  const query = document.getElementById('search').value.toLowerCase();
  const filteredTransactions = transactions.filter(
    t => t.type.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) //filtering transactions
  );

  tableBody.innerHTML = '';

  //showing the filtered transaction
  filteredTransactions.forEach((transaction, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.type}</td>
      <td>${transaction.category}</td>
      <td>${transaction.amount}</td>
      <td>${transaction.date}</td>
      <td>
        <button onclick="deleteTransaction(${index})">Delete</button>
        <button onclick="editTransaction(${index})">Edit</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function updateChart() {
  const dates = [];
  const incomes = [];
  const expenses = [];
  const balances = [];

  let runningBalance = parseFloat(document.getElementById('startingBalance').value) || 0; // Start with the initial balance.

  // Sort transactions by date to ensure chronological order
  const sortedTransactions = transactions.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedTransactions.forEach(transaction => {
    dates.push(transaction.date);

    if (transaction.type === 'Income') {
      incomes.push(transaction.amount);
      expenses.push(0);
      runningBalance += transaction.amount; // Add income to the running balance
    } else if (transaction.type === 'Expense') {
      incomes.push(0);
      expenses.push(transaction.amount);
      runningBalance -= transaction.amount; // Subtract expense from the running balance
    }

    balances.push(runningBalance); // Record the updated balance
  });

  // Destroying the old chart instance before creating a new one for updating it
  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Incomes',
          data: incomes,
          borderColor: 'green',
          fill: false,
        },
        {
          label: 'Expenses',
          data: expenses,
          borderColor: 'red',
          fill: false,
        },
        {
          label: 'Current Balance',
          data: balances,
          borderColor: 'blue',
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Amount ($)',
          },
        },
      },
    },
  });
}

//Function for creating PDF
function pdf() {

  const jsPDF = window.jspdf.jsPDF; 
  const pdf = new jsPDF();

  //getting starting balance and balance
  const startingBalance = parseFloat(document.getElementById('startingBalance').value) || 0;
  const balancelabel = document.getElementById('balance');

  //removing weird characters from balance
  const currentBalanceText = balancelabel.textContent;
  const pdfBalance = parseFloat(currentBalanceText.replace(/[^0-9.-]+/g, "")) || 0;
  
  //Adding Title
  pdf.setFontSize(18);
  pdf.text('Personal Finance Tracker Report', 10, 10);

  // Adding Date and Time
  const currentDate = new Date().toLocaleString();
  pdf.setFontSize(12);
  pdf.text(`Generated on: ${currentDate}`, 10, 20);

  //Adding Current Balance and Starting Balance
  pdf.setFontSize(14);
  pdf.text(`Starting Balance: $${startingBalance.toFixed(2)}`, 10, 30);
  pdf.text(`Current Balance: $${pdfBalance.toFixed(2)}`, 10, 40);

  // Adding Transactions Table
  let yOffset = 50; // Starting Y position for the table
  pdf.setFontSize(14);
  pdf.text('Transactions:', 10, yOffset);

  yOffset += 10;
  const transactionTable = document.getElementById('transactionTable');
  const rows = Array.from(transactionTable.rows);

  if (rows.length > 0) {
    rows.forEach(row => {
      const cells = Array.from(row.cells);
      let rowText = '';
      cells.forEach(cell => (rowText += `${cell.innerText}  `));
      pdf.text(rowText, 10, yOffset);
      yOffset += 10; // Adding space for each row
    });
  } else {
    pdf.text('No transactions available.', 10, yOffset);
  }

  //Adding Graph
  const chartCanvas = document.getElementById('summaryChart');
  if (chartCanvas.style.display !== 'none') {
    const chartImage = chartCanvas.toDataURL('image/png');
    yOffset += 20; // Add spacing before the chart
    pdf.addImage(chartImage, 'PNG', 10, yOffset, 180, 80); // Add image to PDF
  }

  //Saving PDF
  pdf.save('Finance_Report.pdf');
}