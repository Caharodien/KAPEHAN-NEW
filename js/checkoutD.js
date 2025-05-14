// =============================================
// Order History Save Function (Global Scope)
// =============================================
function saveOrderToHistory(orderData) {
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

// Generate a 7-digit order number with D prefix (D for Dine-in)
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
    const currentOrder = JSON.parse(localStorage.getItem("currentOrder")) || [];
    const totalPrice = parseFloat(totalPriceElement.textContent.replace('₱', '')) || 0;

    // Display order items
    function displayOrderItems() {
        orderListElement.innerHTML = '';
        let calculatedTotal = 0;

        currentOrder.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">x${item.quantity || 1}</span>
                <span class="item-price">₱${(item.price * (item.quantity || 1)).toFixed(2)}</span>
            `;
            orderListElement.appendChild(li);
            calculatedTotal += item.price * (item.quantity || 1);
        });

        totalPriceElement.textContent = `₱${calculatedTotal.toFixed(2)}`;
        return calculatedTotal;
    }

    // Initial display
    const calculatedTotal = displayOrderItems();

    // =============================================
    // Confirm Payment Button Handler
    // =============================================
    confirmPaymentButton.addEventListener("click", async function () {
        if (currentOrder.length === 0) {
            alert('Please add items to your order first!');
            return;
        }

        const orderType = "Dine-in";
        const totalAmount = calculatedTotal;
        const orderNumber = generateOrderNumber();
        
        try {
            // First save to database
            console.log('Attempting to save order to database...');
            const response = await fetch('http://localhost:3001/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_type: orderType,
                    items: currentOrder,
                    total_amount: totalAmount,
                    payment_method: 'Cash'
                })
            });
            
            const dbData = await response.json();
            
            if (!response.ok) {
                throw new Error(dbData.message || 'Failed to save order to database');
            }

            console.log('Order saved to database:', dbData);

            // Then save to local history
            const completeOrderData = {
                id: orderNumber,
                orderType: orderType,
                items: currentOrder.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1
                })),
                total: totalAmount,
                paymentMethod: "Cash",
                timestamp: new Date().toISOString(),
                dbId: dbData.order.id,
                dbOrderNumber: dbData.order.order_number
            };

            const priorityNumber = saveOrderToHistory(completeOrderData);

            if (priorityNumber) {
                // Store all receipt data
                const receiptData = {
                    orderNumber: orderNumber,
                    priorityNumber: priorityNumber,
                    orderType: orderType,
                    items: currentOrder,
                    total: totalAmount,
                    paymentMethod: "Cash",
                    timestamp: completeOrderData.timestamp,
                    dbOrderNumber: dbData.order.order_number
                };
                
                localStorage.setItem("receiptData", JSON.stringify(receiptData));
                
                // Also store in overview data for view order list
                const overviewData = {
                    priorityNumber: priorityNumber,
                    orderNumber: orderNumber,
                    orderType: orderType,
                    items: currentOrder.map(item => ({
                        name: item.name,
                        quantity: item.quantity || 1
                    })),
                    total: totalAmount,
                    timestamp: completeOrderData.timestamp,
                    dbOrderNumber: dbData.order.order_number
                };
                localStorage.setItem("latestOrderOverview", JSON.stringify(overviewData));

                // Update the view order list immediately
                if (typeof updateViewOrderList === 'function') {
                    updateViewOrderList(overviewData);
                }

                // Animation before redirect
                body.classList.add("pull-down-exit");
                setTimeout(() => {
                    localStorage.removeItem("currentOrder");
                    window.location.href = "receipt.html";
                }, 500);
            } else {
                throw new Error("Failed to save to local history");
            }
        } catch (error) {
            console.error('Error processing order:', error);
            alert(`Error: ${error.message}\nCheck console for details.`);
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