function saveOrderToHistory(orderData) {
    try {
        let orders = JSON.parse(localStorage.getItem('coffeeShopOrders') || "[]");
        if (!Array.isArray(orders)) {
            console.warn("Existing orders data was not an array, resetting");
            orders = [];
        }

        let maxPriority = 0;
        if (orders.length > 0) {
            maxPriority = Math.max(...orders.map(order => 
                order.priorityNumber || 0
            ));
        }

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

function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const orderNum = 'T' + timestamp.slice(-6) + Math.floor(Math.random() * 10);
    return orderNum.slice(0, 8); 
}
document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = 'http://localhost:3001/api';
    
    const orderListElement = document.getElementById("order-list");
    const totalPriceElement = document.getElementById("total-price");
    const confirmPaymentButton = document.getElementById("confirm-payment");
    const addMoreButton = document.getElementById("add-more");
    const body = document.body;

    const currentOrder = JSON.parse(localStorage.getItem("currentOrder")) || [];

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

    const calculatedTotal = displayOrderItems();
    confirmPaymentButton.addEventListener("click", async function () {
        if (currentOrder.length === 0) {
            alert('Please add items to your order first!');
            return;
        }

        const orderType = "takeout";
        const totalAmount = calculatedTotal;
        const orderNumber = generateOrderNumber();
        
        try {
            console.log('Saving order to database...');
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_type: orderType,
                    items: currentOrder.map(item => ({
                        name: item.name,
                        quantity: item.quantity || 1,
                        price: item.price
                    })),
                    total_amount: totalAmount,
                    payment_method: 'Cash'
                })
            });
            
            const dbData = await response.json();
            
            if (!response.ok) {
                throw new Error(dbData.message || 'Failed to save order');
            }

            const completeOrderData = {
                id: orderNumber,
                orderType: "Takeout",
                items: currentOrder,
                total: totalAmount,
                paymentMethod: "Cash",
                timestamp: new Date().toISOString(),
                dbId: dbData.order.id,
                dbOrderNumber: dbData.order.order_number,
                status: dbData.order.status || 'Pending'
            };

            const priorityNumber = saveOrderToHistory(completeOrderData);

            if (priorityNumber) {
                localStorage.setItem("receiptData", JSON.stringify({
                    orderNumber: orderNumber,
                    priorityNumber: priorityNumber,
                    orderType: "Takeout",
                    items: currentOrder,
                    total: totalAmount,
                    timestamp: completeOrderData.timestamp,
                    dbOrderNumber: dbData.order.order_number
                }));
                
                window.location.href = "receipt.html";
            }
        } catch (error) {
            console.error('Error processing order:', error);
            alert('Error processing order. Please try again.');
        }
    });
    addMoreButton.addEventListener("click", function () {
        body.classList.add("pull-down-exit");
        setTimeout(() => {
            window.location.href = "takeoutmenu.html";
        }, 500);
    });
});