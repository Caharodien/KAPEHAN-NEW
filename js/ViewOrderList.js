document.addEventListener('DOMContentLoaded', function() {
    displayOrders();
});

function displayOrders() {
    const orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const tableBody = document.getElementById('ordersTableBody');
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
        return;
    }
    
    // Sort orders by timestamp (newest first)
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create a map to track unique orders by their ID
    const uniqueOrders = new Map();
    
    orders.forEach(order => {
        if (uniqueOrders.has(order.id || order.orderNumber)) return;
        uniqueOrders.set(order.id || order.orderNumber, true);
        
        const row = document.createElement('tr');
        row.classList.add(order.orderType.toLowerCase() === 'takeout' ? 'takeout-order' : 'dinein-order');
        
        // Process items
        const itemCounts = {};
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                const key = item.name;
                itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
            });
        }
        
        const itemsList = Object.keys(itemCounts).length > 0
            ? Object.entries(itemCounts).map(([name, quantity]) => `${name} (${quantity})`).join(', ')
            : 'No items';
        
        // Format date and time
        let dateString = 'N/A', timeString = 'N/A';
        try {
            const orderTime = new Date(order.timestamp);
            dateString = orderTime.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            timeString = orderTime.toLocaleTimeString([], { 
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch (e) {
            console.error('Error formatting date/time:', e);
        }
        
        const typeIndicator = order.orderType.toLowerCase() === 'takeout' ? '🛍️ Takeout' : '🍽️ Dine-in';
        
        if (!order.status) {
            order.status = 'pending';
            updateOrderInLocalStorage(order);
        }
        
        // Create radio buttons for status
        const statusCell = document.createElement('td');
        statusCell.className = 'status-cell';
        
        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-radio-container';
        
        const statusOptions = [
            { value: 'pending', label: 'Pending' },
            { value: 'preparing', label: 'Preparing' },
            { value: 'serving', label: 'Serving' },
            { value: 'completed', label: 'Completed' }
        ];
        
        statusOptions.forEach(option => {
            const radioDiv = document.createElement('div');
            radioDiv.className = 'status-radio-option';
            
            const radioId = `status-${order.id || order.orderNumber}-${option.value}`;
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `status-${order.id || order.orderNumber}`;
            radio.id = radioId;
            radio.value = option.value;
            radio.checked = order.status === option.value;
            radio.dataset.orderId = order.id || order.orderNumber;
            
            const label = document.createElement('label');
            label.htmlFor = radioId;
            label.textContent = option.label;
            
            radio.addEventListener('change', function() {
                if (this.checked) {
                    updateOrderStatus(this.dataset.orderId, this.value);
                }
            });
            
            radioDiv.appendChild(radio);
            radioDiv.appendChild(label);
            statusContainer.appendChild(radioDiv);
        });
        
        statusCell.appendChild(statusContainer);
        
        row.innerHTML = `
            <td>${order.priorityNumber || 'N/A'}</td>
            <td>${order.id || order.orderNumber || 'N/A'}</td>
            <td class="order-type-cell">${typeIndicator}</td>
            <td>${itemsList}</td>
            <td>₱${order.total ? order.total.toFixed(2) : '0.00'}</td>
            <td>${dateString}</td>
            <td>${timeString}</td>
        `;
        
        row.appendChild(statusCell);
        tableBody.appendChild(row);
    });

    // Update P&S list after displaying all orders
    syncPreparingServingOrders();
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const orderIndex = orders.findIndex(order => 
        (order.id === orderId) || (order.orderNumber === orderId)
    );

    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('coffeeShopOrders', JSON.stringify(orders));
        
        // Update P&S list
        syncPreparingServingOrders();
        
        // No need to redisplay all orders, just update the status
    }
}

function syncPreparingServingOrders() {
    const allOrders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const preparingServingOrders = allOrders.filter(order => 
        order.status === 'preparing' || order.status === 'serving'
    );
    
    localStorage.setItem('preparingServingOrders', JSON.stringify(preparingServingOrders));
}

function updateOrderInLocalStorage(updatedOrder) {
    const orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const orderIndex = orders.findIndex(order => 
        (order.id === updatedOrder.id) || (order.orderNumber === updatedOrder.orderNumber)
    );
    
    if (orderIndex !== -1) {
        orders[orderIndex] = updatedOrder;
        localStorage.setItem('coffeeShopOrders', JSON.stringify(orders));
    }
}

// Update the order list when new data is added from other pages
window.addEventListener('storage', function(event) {
    if (event.key === 'coffeeShopOrders') {
        displayOrders();
    }
});