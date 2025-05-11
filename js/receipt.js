document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
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
        printReceiptBtn: document.getElementById("print-receipt"),
        receiptContainer: document.querySelector(".receipt-container")
    };

    // Try to get order data from multiple possible sources
    const getOrderData = () => {
        // First try receiptData (new system)
        let data = JSON.parse(localStorage.getItem("receiptData"));
        
        // Fallback to individual items (legacy system)
        if (!data) {
            data = {
                orderNumber: localStorage.getItem("receiptOrderId") || "N/A",
                orderType: localStorage.getItem("orderType") || "Dine-in",
                items: JSON.parse(localStorage.getItem("receiptOrderList") || "[]"),
                total: parseFloat(localStorage.getItem("receiptTotalPrice") || 0),
                paymentMethod: localStorage.getItem("receiptPaymentMethod") || "Cash",
                timestamp: localStorage.getItem("receiptOrderTime") || new Date().toISOString(),
                priorityNumber: "N/A" // Default if not available
            };
        }
        
        return data;
    };

    const orderData = getOrderData();

    // Validate we have basic order data
    if (!orderData.items || orderData.items.length === 0) {
        alert("No order data found. Please place an order first.");
        window.location.href = "index.html";
        return;
    }

    // Set order type class for styling
    const orderType = orderData.orderType || "Dine-in";
    document.body.classList.add(orderType.toLowerCase() + "-receipt");

    // Formatting functions
    const formatOrderId = (id) => {
        if (!id || id === "N/A") return "N/A";
        if (id.length <= 8) return id;
        return `${id.substring(0, 4)}...${id.slice(-4)}`;
    };

    const formatTime = (date) => {
        try {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "N/A";
        }
    };

    const formatDate = (date) => {
        try {
            return date.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return "N/A";
        }
    };

    // Process order date/time
    let orderDate;
    try {
        orderDate = new Date(orderData.timestamp);
    } catch {
        orderDate = new Date();
    }

    // Display order information
    elements.orderId.textContent = formatOrderId(orderData.orderNumber);
    elements.orderDate.textContent = formatDate(orderDate);
    elements.orderTime.textContent = formatTime(orderDate);
    elements.paymentMethod.textContent = orderData.paymentMethod;
    elements.orderType.textContent = orderType === "Takeout" ? "Takeout" : "Dine-in";
    elements.priorityNumber.textContent = orderData.priorityNumber || "N/A";

    // Calculate and display prices
    const subtotal = orderData.items.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
    }, 0);
    
    elements.subtotalPrice.textContent = `₱${subtotal.toFixed(2)}`;
    elements.totalPrice.textContent = `₱${(orderData.total || subtotal).toFixed(2)}`;

    // Display order items
    elements.orderList.innerHTML = ""; // Clear existing
    orderData.items.forEach(item => {
        const li = document.createElement("li");
        const quantity = item.quantity || 1;
        li.innerHTML = `
            <span class="item-name">${quantity}x ${item.name}</span>
            <span class="item-price">₱${(item.price * quantity).toFixed(2)}</span>
        `;
        elements.orderList.appendChild(li);
    });

    // Button functionality
    elements.newOrderBtn.addEventListener("click", () => {
        // Clear temporary order data
        ["receiptData", "receiptOrderList", "receiptTotalPrice", "receiptOrderId", "orderType", "receiptPaymentMethod", "receiptOrderTime"].forEach(key => {
            localStorage.removeItem(key);
        });
        window.location.href = "index.html";
    });

    // Enhanced Print Functionality with auto-print
  // Enhanced Print Functionality with auto-print
const printReceipt = () => {
    // Get the original receipt container
    const originalContainer = elements.receiptContainer;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Basic HTML structure with minimal styling
    printWindow.document.write(`
        <html>
            <head>
                <title>Order Receipt</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 10px;
                        text-align: center;
                    }
                    .receipt {
                        width: 80mm;
                        margin: 0 auto;
                        text-align: center;
                    }
                    h1, h2 {
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .order-meta {
                        margin-bottom: 15px;
                    }
                    .meta-item {
                        margin-bottom: 5px;
                    }
                    ul {
                        list-style-type: none;
                        padding: 0;
                        margin-bottom: 15px;
                    }
                    li {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .total-section {
                        margin-top: 10px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .grand-total {
                        font-weight: bold;
                        border-top: 1px solid #000;
                        padding-top: 5px;
                    }
                    .payment-method {
                        margin-top: 10px;
                        margin-bottom: 15px;
                    }
                    .footer-logo {
                        width: 70px;
                        height: auto;
                        margin: 10px auto;
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <h1>Script & Sip</h1>
                    <p>Coffee Shop Receipt</p>
                    
                    <div class="order-meta">
                        <div class="meta-item">
                            <span>Order # ${elements.orderId.textContent}</span>
                        </div>
                        <div class="meta-item">
                            <span>Priority # ${elements.priorityNumber.textContent}</span>
                        </div>
                        <div class="meta-item">
                            <span>Date: ${elements.orderDate.textContent}</span>
                        </div>
                        <div class="meta-item">
                            <span>Time: ${elements.orderTime.textContent}</span>
                        </div>
                        <div class="meta-item">
                            <span>Type: ${elements.orderType.textContent}</span>
                        </div>
                    </div>
                    
                    <h2>Your Order</h2>
                    <ul>
                        ${Array.from(document.querySelectorAll('#order-list li')).map(item => 
                            `<li>
                                <span>${item.querySelector('.item-name').textContent}</span>
                                <span>${item.querySelector('.item-price').textContent}</span>
                            </li>`
                        ).join('')}
                    </ul>
                    
                    <div class="total-section">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>${elements.subtotalPrice.textContent}</span>
                        </div>
                        <div class="total-row">
                            <span>Service Charge</span>
                            <span>₱0.00</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total</span>
                            <span>${elements.totalPrice.textContent}</span>
                        </div>
                    </div>
                    
               
                    <img src="images/logo3.0.png" alt="Logo" class="footer-logo">
                </div>
                
                <script>
                    // Print after slight delay to ensure everything is loaded
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 300);
                </script>
            </body>
        </html>
    `);
    
    printWindow.document.close();
};
    // Add print event listener
    if (elements.printReceiptBtn) {
        elements.printReceiptBtn.addEventListener("click", printReceipt);
    }

    // Auto-print the receipt after a short delay
    setTimeout(() => {
        printReceipt();
    }, 500);

    // Auto-redirect after 30 seconds (cancelable)
    const redirectTimer = setTimeout(() => {
        window.location.href = "index.html";
    }, 30000);

    // Cancel redirect if user interacts with the page
    document.addEventListener("click", () => {
        clearTimeout(redirectTimer);
    });
});

function animateReceiptExit(destination) {
    document.body.classList.add('receipt-exit');
    setTimeout(() => {
        window.location.href = destination;
    }, 400); // Matches the 0.4s animation duration
}