// =============================================
// ViewOrderList.js (Merged Logic)
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3001/api/orders');
        const data = await response.json();

        if (data.success) {
            const apiOrders = data.orders.map(order => ({
                id: order.order_id,
                orderNumber: order.order_number,
                orderType: order.order_type,
                items: JSON.parse(order.items || '[]'),
                total: order.total_amount,
                timestamp: order.created_at,
                priorityNumber: order.priority_number,
                status: order.status || 'pending'
            }));

            const localOrders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');

            const mergedOrdersMap = new Map();

            [...localOrders, ...apiOrders].forEach(order => {
                const key = order.id || order.orderNumber;
                if (!mergedOrdersMap.has(key)) {
                    mergedOrdersMap.set(key, order);
                }
            });

            const mergedOrders = Array.from(mergedOrdersMap.values());
            localStorage.setItem('coffeeShopOrders', JSON.stringify(mergedOrders));
            displayOrders();
        }
    } catch (error) {
        console.error('Error fetching orders from API:', error);
        displayOrders(); // Fallback to localStorage
    }
});

function displayOrders() {
    const orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const tableBody = document.getElementById('ordersTableBody');

    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
        return;
    }

    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const uniqueOrders = new Map();

    orders.forEach(order => {
        const key = order.id || order.orderNumber;
        if (uniqueOrders.has(key)) return;
        uniqueOrders.set(key, true);

        const row = document.createElement('tr');
        row.classList.add(order.orderType.toLowerCase() === 'takeout' ? 'takeout-order' : 'dinein-order');

        const itemCounts = {};
        (order.items || []).forEach(item => {
            const name = item.name;
            itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
        });

        const itemsList = Object.keys(itemCounts).length > 0
            ? Object.entries(itemCounts).map(([name, qty]) => `${name} (${qty})`).join(', ')
            : 'No items';

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

            radio.addEventListener('change', function () {
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

    syncPreparingServingOrders();
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const orderIndex = orders.findIndex(order => (order.id === orderId || order.orderNumber === orderId));

    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('coffeeShopOrders', JSON.stringify(orders));
        syncPreparingServingOrders();
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
        order.id === updatedOrder.id || order.orderNumber === updatedOrder.orderNumber
    );

    if (orderIndex !== -1) {
        orders[orderIndex] = updatedOrder;
        localStorage.setItem('coffeeShopOrders', JSON.stringify(orders));
    }
}

window.addEventListener('storage', function (event) {
    if (event.key === 'coffeeShopOrders') {
        displayOrders();
    }
});