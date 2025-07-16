// scripts/main.js
window.API_URL = "https://script.google.com/macros/s/AKfycbxdSfR8XoEwxM-pvGWsxF33zVpTQ9QPZgDEpfjiRYNT0vGzHOm-buXXhPsOZVVYVPzOew/exec"; // Replace with your Google Apps Script Web app URL

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
          body: JSON.stringify({ customerId, customerName })
        });
        const result = await response.json();
        if (result.status === 'success') {
          alert('Customer added successfully');
          customerForm.reset();
          loadCustomers();
        } else {
          alert('Error adding customer: ' + result.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to add customer');
      }
    });
  }

  async function loadCustomers() {
    if (customerList) {
      try {
        const response = await fetch(`${window.API_URL}?action=getCustomers`);
        const customers = await response.json();
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
      }
    }
  }

  window.deleteCustomer = async (customerId) => {
    try {
      const response = await fetch(`${window.API_URL}?action=deleteCustomer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert('Customer deleted successfully');
        loadCustomers();
      } else {
        alert('Error deleting customer: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete customer');
    }
  };

  if (customerList) loadCustomers();
});