document.addEventListener("DOMContentLoaded", function() {
    const elements = {
        orderList: document.getElementById("order-list"),
        totalPrice: document.getElementById("total-price"),
        subtotalPrice: document.getElementById("subtotal-price"),
        orderId: document.getElementById("order-id"),
        orderDate: document.getElementById("order-date"),
        orderTime: document.getElementById("order-time"),
        paymentMethod: document.getElementById("payment-method"),
        orderType: document.getElementById("order-type"),
        priorityNumber: document.getElementById("priority-number"),
        newOrderBtn: document.getElementById("new-order"),
        receiptContainer: document.querySelector(".receipt-container")
    };

    const API_BASE_URL = 'http://localhost:3001/api';

    const getOrderData = () => {
        let data = JSON.parse(localStorage.getItem("receiptData"));
        
        if (!data) {
            data = {
                orderNumber: localStorage.getItem("receiptOrderId") || "N/A",
                orderType: localStorage.getItem("orderType") || "Dine-in",
                items: JSON.parse(localStorage.getItem("receiptOrderList") || "[]"),
                total: parseFloat(localStorage.getItem("receiptTotalPrice") || 0),
                paymentMethod: localStorage.getItem("receiptPaymentMethod") || "Cash",
                timestamp: localStorage.getItem("receiptOrderTime") || new Date().toISOString(),
                priorityNumber: "N/A", 
                dbOrderNumber: null 
            };
        }
        
        return data;
    };

    const orderData = getOrderData();    
    
    async function fetchOrderDataFromApi(dbOrderNumber) {
        if (!dbOrderNumber) return null;
        
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${dbOrderNumber}`);
            const data = await response.json();
            
            if (data.success && data.order) {
                return data.order;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching order from API:', error);
            return null;
        }
    }
    
    if (!orderData.items || orderData.items.length === 0) {
        alert("No order data found. Please place an order first.");
        window.location.href = "index.html";
        return;
    }

    const orderType = orderData.orderType || "Dine-in";
    document.body.classList.add(orderType.toLowerCase() + "-receipt");
    const formatOrderId = (id) => {
        if (!id || id === "N/A") return "N/A";
        return id.toString().padStart(4, '0');
    };
    
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };
    
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const formatPrice = (price) => {
        return '₱' + parseFloat(price).toFixed(2);
    };

    const updateReceiptUI = (data) => {
        elements.orderId.textContent = data.dbOrderNumber || formatOrderId(data.orderNumber);
        elements.orderDate.textContent = formatDate(data.timestamp);
        elements.orderTime.textContent = formatTime(data.timestamp);
        elements.orderType.textContent = data.orderType;
        elements.priorityNumber.textContent = data.priorityNumber || "N/A";
        elements.paymentMethod.textContent = data.paymentMethod || "Cash";
        
        elements.orderList.innerHTML = '';
        let subtotal = 0;
        
        data.items.forEach(item => {
            const quantity = item.quantity || 1;
            const price = item.price * quantity;
            subtotal += price;
            
            const li = document.createElement('li');
            li.className = 'order-item';
            li.innerHTML = `
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">x${quantity}</span>
                <span class="item-price">${formatPrice(price)}</span>
            `;
            elements.orderList.appendChild(li);
        });
        
        elements.subtotalPrice.textContent = formatPrice(subtotal);
        elements.totalPrice.textContent = formatPrice(data.total);
        
        const readyTime = document.getElementById('ready-time');
        if (readyTime) {
            const waitTime = data.orderType.toLowerCase() === 'takeout' ? '10 minutes' : '5 minutes';
            readyTime.textContent = `Please return in ${waitTime}`;
        }
    };

    updateReceiptUI(orderData);
    
    if (orderData.dbOrderNumber) {
        fetchOrderDataFromApi(orderData.dbOrderNumber)
            .then(apiData => {
                if (apiData) {
                    const updatedOrderData = {
                        ...orderData,
                        items: apiData.items.map(item => ({
                            name: item.product_name,
                            price: parseFloat(item.price),
                            quantity: item.quantity
                        })),
                        total: parseFloat(apiData.total_amount),
                        priorityNumber: apiData.priority_number,
                        orderType: apiData.order_type === 'dine-in' ? 'Dine-in' : 'Takeout',
                        timestamp: apiData.order_time,
                        status: apiData.status
                    };
                    
                    updateReceiptUI(updatedOrderData);
                }
            })
            .catch(error => console.error('Error updating receipt with API data:', error));
    }

    elements.newOrderBtn.addEventListener('click', () => {
        window.location.href = 'D&T.html';
    });
});