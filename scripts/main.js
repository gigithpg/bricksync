// scripts/main.js
window.API_URL = "https://cors-proxy.gigithpg.workers.dev"; // Direct Apps Script URL

document.addEventListener('DOMContentLoaded', () => {
  const customerForm = document.getElementById('customerForm');
  const customerList = document.getElementById('customerList');

  if (customerForm) {
    customerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customerId = document.getElementById('customerId').value;
      const customerName = document.getElementById('customerName').value;

      try {
        const response = await fetch(`${window.API_URL}?action=addCustomer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, customerName }),
          mode: 'cors'
        });
        if (!response.ok) {
          const text = await response.text();
          console.log('Add customer response:', text);
          throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.status === 'success') {
          alert('Customer added successfully');
          customerForm.reset();
          loadCustomers();
        } else {
          alert('Error adding customer: ' + result.message);
        }
      } catch (error) {
        console.error('Error adding customer:', error);
        alert('Failed to add customer: ' + error.message);
      }
    });
  }

  async function loadCustomers() {
    if (customerList) {
      try {
        const response = await fetch(`${window.API_URL}?action=getCustomers`, {
          method: 'GET',
          mode: 'cors'
        });
        if (!response.ok) {
          const text = await response.text();
          console.log('Get customers response:', text);
          throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        }
        const text = await response.text();
        console.log('Get customers response:', text);
        const customers = JSON.parse(text);
        customerList.innerHTML = '';
        customers.forEach(customer => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${customer.customerId}</td>
            <td>${customer.customerName}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteCustomer('${customer.customerId}')">Delete</button></td>
          `;
          customerList.appendChild(row);
        });
      } catch (error) {
        console.error('Error loading customers:', error);
        customerList.innerHTML = '<tr><td colspan="3">Failed to load customers: ' + error.message + '</td></tr>';
      }
    }
  }

  window.deleteCustomer = async (customerId) => {
    try {
      const response = await fetch(`${window.API_URL}?action=deleteCustomer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
        mode: 'cors'
      });
      if (!response.ok) {
        const text = await response.text();
        console.log('Delete customer response:', text);
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status === 'success') {
        alert('Customer deleted successfully');
        loadCustomers();
      } else {
        alert('Error deleting customer: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer: ' + error.message);
    }
  };

  if (customerList) loadCustomers();
});