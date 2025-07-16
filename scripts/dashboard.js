async function updateDashboard() {
  try {
    const response = await fetch(`${API_URL}?action=getCustomers`);
    if (!response.ok) throw new Error('Failed to fetch customers');
    const customers = await response.json();
    document.getElementById('totalCustomers').textContent = customers.length;
  } catch (error) {
    console.error('Error updating dashboard:', error);
    document.getElementById('totalCustomers').textContent = 'Error';
  }
}

window.onload = updateDashboard;