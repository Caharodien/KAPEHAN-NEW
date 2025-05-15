document.addEventListener('DOMContentLoaded', function() {
    const ordersTableBody = document.getElementById('ordersTableBody');
    const API_BASE_URL = 'http://localhost:3001/api';
    
    async function loadOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load orders');
            }
            
            displayOrders(data.orders);
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="error-message">
                        Failed to load orders from the database. Please try again later.
                        <br>Error: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    function displayOrders(orders) {
        if (!orders || orders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-orders-message">
                        No orders found in the database.
                    </td>
                </tr>
            `;
            return;
        }
        
        orders.sort((a, b) => {
            if (a.priority_number !== b.priority_number) {
                return a.priority_number - b.priority_number;
            }
            
            return new Date(b.order_time) - new Date(a.order_time);
        });
        
        ordersTableBody.innerHTML = '';
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            
            const itemsDisplay = order.items.map(item => 
                `${item.product_name} x${item.quantity}`
            ).join(', ');
            
            const orderDate = new Date(order.order_time);
            const formattedDate = orderDate.toLocaleDateString();
            const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const statusClass = getStatusClass(order.status);
            
            row.innerHTML = `
                <td>${order.priority_number || 'N/A'}</td>
                <td>${order.order_number}</td>
                <td>${order.order_type}</td>
                <td class="items-cell">${itemsDisplay}</td>
                <td>${formatPrice(order.total_amount)}</td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td class="status ${statusClass}">${order.status}</td>
            `;
            
            row.addEventListener('click', () => showOrderDetails(order));
            
            ordersTableBody.appendChild(row);
        });
    }
    
    function formatPrice(price) {
        return `₱${parseFloat(price).toFixed(2)}`;
    }
    
    function getStatusClass(status) {
        switch (status) {
            case 'Pending': return 'status-pending';
            case 'Preparing': return 'status-preparing';
            case 'Ready': return 'status-ready';
            case 'Completed': return 'status-completed';
            default: return '';
        }
    }
        function showOrderDetails(order) {
        console.log('Order details:', order);
    }
    
    window.updateViewOrderList = function(newOrder) {
        console.log('Order list updated with new order:', newOrder);
        
        loadOrders();
    };
    
    loadOrders();
    
    setInterval(loadOrders, 30000);
});