document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3001/api';
    
    displayPreparingServingOrders();
    
    setInterval(displayPreparingServingOrders, 10000);
    
    window.addEventListener('storage', function(event) {
        if (event.key === 'preparingServingOrders' || event.key === 'coffeeShopOrders') {
            displayPreparingServingOrders();
        }
    });
    
    async function displayPreparingServingOrders() {
        try {
            const preparingResponse = await fetch(`${API_BASE_URL}/orders/status/Preparing`);
            const preparingData = await preparingResponse.json();
            
            const readyResponse = await fetch(`${API_BASE_URL}/orders/status/Ready`);
            const readyData = await readyResponse.json();
            
            const preparingContainer = document.getElementById('preparingOrdersContainer');
            const servingContainer = document.getElementById('servingOrdersContainer');
            
            preparingContainer.innerHTML = '';
            servingContainer.innerHTML = '';
            
            if (!preparingData.success || !preparingData.orders || preparingData.orders.length === 0) {
                preparingContainer.innerHTML = '<div class="no-orders">No orders in preparation</div>';
            } else {
                const priorityGrid = document.createElement('div');
                priorityGrid.className = 'priority-numbers-grid';
                
                preparingData.orders.sort((a, b) => a.priority_number - b.priority_number);
                
                preparingData.orders.forEach(order => {
                    const priorityItem = document.createElement('div');
                    priorityItem.className = 'priority-number-item preparing';
                    priorityItem.textContent = order.priority_number || 'N/A';
                    
                    priorityItem.addEventListener('click', () => updateOrderStatus(order.id, 'Ready'));
                    
                    priorityGrid.appendChild(priorityItem);
                });
                
                preparingContainer.appendChild(priorityGrid);
            }
            
            if (!readyData.success || !readyData.orders || readyData.orders.length === 0) {
                servingContainer.innerHTML = '<div class="no-orders">No orders ready to serve</div>';
            } else {
                const priorityGrid = document.createElement('div');
                priorityGrid.className = 'priority-numbers-grid';
                
                readyData.orders.sort((a, b) => a.priority_number - b.priority_number);
                
                readyData.orders.forEach(order => {
                    const priorityItem = document.createElement('div');
                    priorityItem.className = 'priority-number-item serving';
                    priorityItem.textContent = order.priority_number || 'N/A';
                    
                    priorityItem.addEventListener('click', () => updateOrderStatus(order.id, 'Completed'));
                    
                    priorityGrid.appendChild(priorityItem);
                });
                
                servingContainer.appendChild(priorityGrid);
            }
            
            const allOrders = [
                ...(preparingData.orders || []).map(o => ({ ...o, status: 'preparing' })),
                ...(readyData.orders || []).map(o => ({ ...o, status: 'serving' }))
            ];
            
            localStorage.setItem('preparingServingOrders', JSON.stringify(allOrders));
            
        } catch (error) {
            console.error('Error fetching orders:', error);
            
            const errorMessage = `
                <div class="error-message">
                    Failed to load orders from database.
                    <button onclick="displayPreparingServingOrders()">Retry</button>
                </div>
            `;
            
            document.getElementById('preparingOrdersContainer').innerHTML = errorMessage;
            document.getElementById('servingOrdersContainer').innerHTML = errorMessage;
        }
    }
    
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const notification = document.createElement('div');
                notification.className = 'status-notification';
                notification.textContent = `Order #${orderId} status updated to ${newStatus}`;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 500);
                }, 2000);
                
                displayPreparingServingOrders();
            } else {
                throw new Error(data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert(`Failed to update order status: ${error.message}`);
        }
    }
    
    window.displayPreparingServingOrders = displayPreparingServingOrders;
});