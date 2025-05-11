document.addEventListener("DOMContentLoaded", function () {
    // Elements
    const hotTab = document.getElementById("hot-tab");
    const coldTab = document.getElementById("cold-tab");
    const hotMenu = document.getElementById("hot-menu");
    const coldMenu = document.getElementById("cold-menu");
    const startAgain = document.getElementById("start-again");
    const confirmModal = document.getElementById("confirm-modal");
    const confirmYes = document.getElementById("confirm-yes");
    const confirmNo = document.getElementById("confirm-no");
    const totalPriceElement = document.getElementById("total-price");
    const orderItemsElement = document.getElementById("order-items");
    const proceedCheckout = document.getElementById("proceed-checkout");
    const container = document.querySelector(".container");

    let totalPrice = 0;
    let orderList = [];

    // Page exit animation function
    function animatePageExit(destination) {
        // Apply slide-up animation
        container.style.animation = "slideUpExit 0.5s ease-out forwards";
        
        // Wait for animation to complete before navigating
        setTimeout(() => {
            window.location.href = destination;
        }, 500);
    }

    // Ensure only HOT menu is visible at the start
    hotMenu.style.display = "grid";
    coldMenu.style.display = "none";

    // HOT button click
    hotTab.addEventListener("click", function () {
        hotMenu.style.display = "grid";
        coldMenu.style.display = "none";
        hotTab.classList.add("active");
        coldTab.classList.remove("active");
    });

    // COLD button click
    coldTab.addEventListener("click", function () {
        coldMenu.style.display = "grid";
        hotMenu.style.display = "none";
        coldTab.classList.add("active");
        hotTab.classList.remove("active");
    });

    // Start Again Button - Show Confirmation Modal
    startAgain.addEventListener("click", function () {
        confirmModal.style.display = "block";
    });

    // If Yes is clicked - Redirect with slide-up animation
    confirmYes.addEventListener("click", function () {
        localStorage.clear();
        animatePageExit("D&T.html");
    });

    // If No is clicked - Close Modal
    confirmNo.addEventListener("click", function () {
        confirmModal.style.display = "none";
    });

    // Add event listeners to all menu items
    document.querySelectorAll(".item").forEach(item => {
        item.addEventListener("click", function () {
            const itemName = this.querySelector("p").innerText;
            const itemPrice = 39; // Assuming each item costs ₱39
            addToOrder(itemName, itemPrice);
            
            // Add click feedback
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "scale(1)";
            }, 100);
        });
    });

    // Add item to order list with quantity tracking
    function addToOrder(name, price) {
        const existingItem = orderList.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.price += price;
        } else {
            orderList.push({ 
                name, 
                price,
                quantity: 1 
            });
        }
        
        totalPrice += price;
        updateOrderList();
        
        // Visual feedback
        const feedback = document.createElement("div");
        feedback.className = "order-feedback";
        feedback.textContent = `+1 ${name}`;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.transform = "translateY(-30px)";
            feedback.style.opacity = "0";
            setTimeout(() => feedback.remove(), 500);
        }, 50);
    }

    // Remove item from order list
    function removeFromOrder(index) {
        const item = orderList[index];
        if (item.quantity > 1) {
            item.quantity -= 1;
            item.price -= 39;
            totalPrice -= 39;
        } else {
            totalPrice -= item.price;
            orderList.splice(index, 1);
        }
        updateOrderList();
    }

    // Update order list display
    function updateOrderList() {
        totalPriceElement.textContent = `₱${totalPrice.toFixed(2)}`;
        
        // Animate price change
        totalPriceElement.style.transform = "scale(1.1)";
        setTimeout(() => {
            totalPriceElement.style.transform = "scale(1)";
        }, 200);
        
        orderItemsElement.innerHTML = "";
        orderList.forEach((item, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                ${item.quantity}x ${item.name} - ₱${item.price.toFixed(2)}
                <button class="remove-btn" data-index="${index}">❌</button>
            `;
            orderItemsElement.appendChild(li);
        });

        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", function () {
                removeFromOrder(this.getAttribute("data-index"));
            });
        });

        localStorage.setItem("orderList", JSON.stringify(orderList));
        localStorage.setItem("totalPrice", totalPrice);
    }

    // Proceed to checkout with slide-up animation
    proceedCheckout.addEventListener("click", function () {
        if (orderList.length === 0) {
            // Shake animation for empty order
            proceedCheckout.style.animation = "shake 0.5s";
            setTimeout(() => {
                proceedCheckout.style.animation = "";
            }, 500);
            
            const message = document.createElement("div");
            message.className = "empty-order-message";
            message.textContent = "Please add items to your order!";
            this.parentNode.insertBefore(message, this.nextSibling);
            
            setTimeout(() => {
                message.style.opacity = "0";
                setTimeout(() => message.remove(), 500);
            }, 2000);
            return;
        }
        animatePageExit("checkoutD.html");
    });

    // Load order from localStorage on page load
    function loadOrder() {
        const savedOrderList = JSON.parse(localStorage.getItem("orderList")) || [];
        const savedTotalPrice = parseFloat(localStorage.getItem("totalPrice")) || 0;

        orderList = savedOrderList;
        totalPrice = savedTotalPrice;

        updateOrderList();
    }

    // Load order when the page loads
    loadOrder();
});