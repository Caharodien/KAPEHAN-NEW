document.addEventListener('DOMContentLoaded', function() {
    // Initial display
    displayPreparingServingOrders();
    
    // Set up interval to check for updates every few seconds
    setInterval(displayPreparingServingOrders, 3000);
    
    // Also listen for storage events from other pages
    window.addEventListener('storage', function(event) {
        if (event.key === 'preparingServingOrders' || event.key === 'coffeeShopOrders') {
            displayPreparingServingOrders();
        }
    });
});

function displayPreparingServingOrders() {
    // Get orders from local storage
    const preparingServingOrders = JSON.parse(localStorage.getItem('preparingServingOrders') || '[]');
    
    // Clear existing containers
    const preparingContainer = document.getElementById('preparingOrdersContainer');
    const servingContainer = document.getElementById('servingOrdersContainer');
    
    preparingContainer.innerHTML = '';
    servingContainer.innerHTML = '';
    
    // Filter orders by status
    const preparingOrders = preparingServingOrders.filter(order => order.status === 'preparing');
    const servingOrders = preparingServingOrders.filter(order => order.status === 'serving');
    
    // Sort orders by priority number
    preparingOrders.sort((a, b) => (a.priorityNumber || 999) - (b.priorityNumber || 999));
    servingOrders.sort((a, b) => (a.priorityNumber || 999) - (b.priorityNumber || 999));
    
    // Display preparing orders
    if (preparingOrders.length === 0) {
        preparingContainer.innerHTML = '<div class="no-orders">No orders in preparation</div>';
    } else {
        const priorityGrid = document.createElement('div');
        priorityGrid.className = 'priority-numbers-grid';
        
        preparingOrders.forEach(order => {
            const priorityItem = document.createElement('div');
            priorityItem.className = 'priority-number-item preparing';
            priorityItem.textContent = order.priorityNumber || 'N/A';
            priorityGrid.appendChild(priorityItem);
        });
        
        preparingContainer.appendChild(priorityGrid);
    }
    
    // Display serving orders
    if (servingOrders.length === 0) {
        servingContainer.innerHTML = '<div class="no-orders">No orders ready to serve</div>';
    } else {
        const priorityGrid = document.createElement('div');
        priorityGrid.className = 'priority-numbers-grid';
        
        servingOrders.forEach(order => {
            const priorityItem = document.createElement('div');
            priorityItem.className = 'priority-number-item serving';
            priorityItem.textContent = order.priorityNumber || 'N/A';
            priorityGrid.appendChild(priorityItem);
        });
        
        servingContainer.appendChild(priorityGrid);
    }
}