const API_URL = 'https://script.google.com/macros/s/AKfycbxdSfR8XoEwxM-pvGWsxF33zVpTQ9QPZgDEpfjiRYNT0vGzHOm-buXXhPsOZVVYVPzOew/exec'; // Replace with your Apps Script web app URL

async function fetchCustomers() {
  try {
    const response = await fetch(`${API_URL}?action=getCustomers`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    console.log('Customers:', data);
    displayCustomers(data);
  } catch (error) {
    console.error('Error fetching customers:', error.message, error.stack);
    if (document.getElementById('customerList')) {
      document.getElementById('customerList').innerHTML = '<tr><td colspan="3">Error loading customers</td></tr>';
    }
    alert('Error fetching customers: ' + error.message);
  }
}

function displayCustomers(customers) {
  const customerList = document.getElementById('customerList');
  if (!customerList) {
    console.warn('customerList element not found');
    return;
  }
  customerList.innerHTML = '';
  customers.forEach(customer => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${customer[0]}</td>
      <td>${customer[1]}</td>
      <td><button class="btn btn-danger btn-sm delete-btn" data-id="${customer[0]}">Delete</button></td>
    `;
    customerList.appendChild(row);
  });
}

async function addCustomer(id, name) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addCustomer', id, name }),
      mode: 'cors',
      credentials: 'omit'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    console.log('Customer added:', id, name);
    fetchCustomers(); // Refresh list
  } catch (error) {
    console.error('Error adding customer:', error.message, error.stack);
    alert('Error adding customer: ' + error.message);
  }
}

async function deleteCustomer(id) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteCustomer', id }),
      mode: 'cors',
      credentials: 'omit'
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    console.log('Customer deleted:', id);
    fetchCustomers(); // Refresh list
  } catch (error) {
    console.error('Error deleting customer:', error.message, error.stack);
    alert('Error deleting customer: ' + error.message);
  }
}

// Initialize customer page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('customerForm')) {
    document.getElementById('customerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('customerId').value.trim();
      const name = document.getElementById('customerName').value.trim();
      if (id && name) {
        await addCustomer(id, name);
        document.getElementById('customerForm').reset();
      } else {
        alert('Please fill in all fields');
      }
    });

    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const id = e.target.getAttribute('data-id');
        if (confirm(`Delete customer ${id}?`)) {
          await deleteCustomer(id);
        }
      }
    });

    fetchCustomers();
  }
});