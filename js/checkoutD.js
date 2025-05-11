// =============================================
// Order History Save Function (Global Scope)
// =============================================
function saveOrder(orderData) {
    try {
        let orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || "[]");
        if (!Array.isArray(orders)) {
            console.warn("Existing orders data was not an array, resetting");
            orders = [];
        }

        // Find the maximum existing priority number
        let maxPriority = 0;
        if (orders.length > 0) {
            maxPriority = Math.max(...orders.map(order => 
                order.priorityNumber || 0
            ));
        }

        // Assign next sequential priority number
        const priorityNumber = maxPriority + 1;
        orderData.priorityNumber = priorityNumber;
        
        orders.push(orderData);
        localStorage.setItem('coffeeShopOrders', JSON.stringify(orders));
        console.log(`Order #${priorityNumber} saved to history`);
        return priorityNumber;
    } catch (error) {
        console.error("Error saving order:", error);
        return false;
    }
}

// Generate a 7-digit order number with D prefix
function generateOrderNumber() {
    const timestamp = Date.now().toString();
    // Get last 6 digits of timestamp + random 1 digit to make 7 digits
    const orderNum = 'D' + timestamp.slice(-6) + Math.floor(Math.random() * 10);
    return orderNum.slice(0, 8); // Ensure max 7 digits after D prefix
}

// =============================================
// Main Dine-in Checkout Logic
// =============================================
document.addEventListener("DOMContentLoaded", function () {
    const orderListElement = document.getElementById("order-list");
    const totalPriceElement = document.getElementById("total-price");
    const confirmPaymentButton = document.getElementById("confirm-payment");
    const addMoreButton = document.getElementById("add-more");
    const body = document.body;

    // Retrieve current order from localStorage
    const orderList = JSON.parse(localStorage.getItem("orderList")) || [];
    const totalPrice = parseFloat(localStorage.getItem("totalPrice")) || 0;

    // Display order items
    orderList.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - ₱${item.price.toFixed(2)}`;
        orderListElement.appendChild(li);
    });

    // Display total price
    totalPriceElement.textContent = `Total: ₱${totalPrice.toFixed(2)}`;

    // =============================================
    // Confirm Payment Button Handler
    // =============================================
    confirmPaymentButton.addEventListener("click", function () {
        const automaticPaymentMethod = "Cash";
        const orderNumber = generateOrderNumber();
        
        // Create complete order data
        const completeOrderData = {
            id: orderNumber,
            orderType: "Dine-In",
            items: orderList.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            })),
            total: totalPrice,
            paymentMethod: automaticPaymentMethod,
            timestamp: new Date().toISOString()
        };

        // Save to order history and get priority number
        const priorityNumber = saveOrder(completeOrderData);

        if (priorityNumber) {
            // Store all receipt data
            const receiptData = {
                orderNumber: orderNumber,
                priorityNumber: priorityNumber,
                orderType: "Dine-In",
                items: orderList,
                total: totalPrice,
                paymentMethod: automaticPaymentMethod,
                timestamp: completeOrderData.timestamp
            };
            
            localStorage.setItem("receiptData", JSON.stringify(receiptData));
            
            // Also store in overview data for view order list
            const overviewData = {
                priorityNumber: priorityNumber,
                orderNumber: orderNumber,
                orderType: "Dine-In",
                items: orderList.map(item => ({
                    name: item.name,
                    quantity: item.quantity || 1
                })),
                total: totalPrice,
                timestamp: completeOrderData.timestamp
            };
            localStorage.setItem("latestOrderOverview", JSON.stringify(overviewData));

            // Update the view order list immediately
            updateViewOrderList(overviewData);

            alert(`Priority #${priorityNumber} confirmed!\n${orderNumber}\nTotal: ₱${totalPrice.toFixed(2)}`);

            // Animation before redirect
            body.classList.add("pull-down-exit");
            setTimeout(() => {
                localStorage.removeItem("orderList");
                localStorage.removeItem("totalPrice");
                window.location.href = "receipt.html";
            }, 500);
        } else {
            alert("Failed to save order. Please try again.");
        }
    });

    // =============================================
    // Add More Button Handler
    // =============================================
    addMoreButton.addEventListener("click", function () {
        body.classList.add("pull-down-exit");
        setTimeout(() => {
            window.location.href = "dinemenu.html";
        }, 500);
    });
});

// =============================================
// Update View Order List Function
// =============================================
function updateViewOrderList(newOrder) {
    try {
        // Get existing orders from view order list
        let orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || "[]");
        
        // Add the new order
        orders.push(newOrder);
        
        // Save back to localStorage
        localStorage.setItem('coffeeShopOrders', JSON.stringify(orders));
        
        // If we're currently on the view order list page, refresh the display
        if (window.location.pathname.includes('vieworderlist.html')) {
            displayOrders();
        }
    } catch (error) {
        console.error("Error updating view order list:", error);
    }
}

// =============================================
// Display Orders Function (for vieworderlist.html)
// =============================================
function displayOrders() {
    // Only run if we're on the view order list page
    if (!window.location.pathname.includes('vieworderlist.html')) return;
    
    const orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || '[]');
    const tableBody = document.getElementById('ordersTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Add class based on order type for styling
        row.classList.add(order.orderType === 'Takeout' ? 'takeout-order' : 'dinein-order');
        
        // Format items list
        const itemsList = order.items && order.items.length > 0 
            ? order.items.map(item => `${item.name} (${item.quantity || 1})`).join(', ') 
            : '';
        
        // Format time
        let timeString = 'N/A';
        try {
            const orderTime = new Date(order.timestamp);
            timeString = orderTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        } catch (e) {
            console.error('Error formatting time:', e);
        }
        
        // Create type indicator with emojis
        const typeIndicator = order.orderType === 'Takeout' 
            ? '🛍️ Takeout' 
            : '🍽️ Dine-in';
        
        row.innerHTML = `
            <td>${order.priorityNumber || 'N/A'}</td>
            <td>${order.orderNumber || order.id || 'N/A'}</td>
            <td class="order-type-cell">${typeIndicator}</td>
            <td>${itemsList}</td>
            <td>₱${order.total ? order.total.toFixed(2) : '0.00'}</td>
            <td>${timeString}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Initialize display if on view order list page
if (window.location.pathname.includes('vieworderlist.html')) {
    document.addEventListener('DOMContentLoaded', displayOrders);
}