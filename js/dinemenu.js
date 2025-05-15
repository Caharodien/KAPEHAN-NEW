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
    let menuItems = [];

    const API_BASE_URL = 'http://localhost:3001/api';

    function animatePageExit(destination) {
        container.style.animation = "slideUpExit 0.5s ease-out forwards";
        
        setTimeout(() => {
            window.location.href = destination;
        }, 500);
    }

    hotMenu.style.display = "grid";
    coldMenu.style.display = "none";

    async function fetchMenuItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/menu/items`);
            const data = await response.json();
            
            if (data.success) {
                return data.items;
            } else {
                console.error('Failed to fetch menu items:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            return [];
        }
    }

    async function initializeMenuItems() {
        hotMenu.innerHTML = '<div class="loading">Loading menu items...</div>';
        coldMenu.innerHTML = '<div class="loading">Loading menu items...</div>';
        
        menuItems = await fetchMenuItems();
        
        if (menuItems.length === 0) {
            hotMenu.innerHTML = '<div class="error">Failed to load menu items. Please try again later.</div>';
            coldMenu.innerHTML = '<div class="error">Failed to load menu items. Please try again later.</div>';
            return;
        }
        
        displayMenuItems();
        setupMenuItemClickHandlers();
    }
    
    function displayMenuItems() {
        const hotItems = menuItems.filter(item => item.category === 'hot');
        const coldItems = menuItems.filter(item => item.category === 'cold');
        
        hotMenu.innerHTML = '';
        coldMenu.innerHTML = '';
        
        hotItems.forEach(item => {
            const itemElement = createMenuItemElement(item);
            hotMenu.appendChild(itemElement);
        });
        
        coldItems.forEach(item => {
            const itemElement = createMenuItemElement(item);
            coldMenu.appendChild(itemElement);
        });
    }
    
    function createMenuItemElement(item) {
        const div = document.createElement('div');
        div.className = 'item';
        div.setAttribute('data-id', item.id);
        div.setAttribute('data-name', item.name);
        div.setAttribute('data-price', item.price);
        
        div.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}">
            <p>${item.name}</p>
            <div class="description">${item.description}</div>
        `;
        
        return div;
    }
    
    function setupMenuItemClickHandlers() {
        document.querySelectorAll(".item").forEach(item => {
            item.addEventListener("click", function() {
                const itemId = this.getAttribute('data-id');
                const itemName = this.getAttribute('data-name');
                const itemPrice = parseFloat(this.getAttribute('data-price'));
                
                addToOrder(itemName, itemPrice);
                
                this.style.transform = "scale(0.95)";
                setTimeout(() => {
                    this.style.transform = "scale(1)";
                }, 100);
            });
        });
    }

    hotTab.addEventListener("click", function () {
        hotMenu.style.display = "grid";
        coldMenu.style.display = "none";
        hotTab.classList.add("active");
        coldTab.classList.remove("active");
    });

    coldTab.addEventListener("click", function () {
        coldMenu.style.display = "grid";
        hotMenu.style.display = "none";
        coldTab.classList.add("active");
        hotTab.classList.remove("active");
    });

    startAgain.addEventListener("click", function () {
        confirmModal.style.display = "block";
    });

    confirmYes.addEventListener("click", function () {
        localStorage.clear();
        animatePageExit("D&T.html");
    });

    confirmNo.addEventListener("click", function () {
        confirmModal.style.display = "none";
    });

    function addToOrder(name, price) {
        const existingItem = orderList.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            orderList.push({ 
                name, 
                price,
                quantity: 1 
            });
        }
        
        totalPrice += price;
        updateOrderList();
    }

    function removeFromOrder(index) {
        const item = orderList[index];
        if (item.quantity > 1) {
            item.quantity -= 1;
            totalPrice -= item.price;
        } else {
            totalPrice -= item.price;
            orderList.splice(index, 1);
        }
        updateOrderList();
    }

    function updateOrderList() {
        totalPriceElement.textContent = `₱${totalPrice.toFixed(2)}`;
        
        orderItemsElement.innerHTML = "";
        orderList.forEach((item, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                ${item.quantity}x ${item.name} - ₱${(item.price * item.quantity).toFixed(2)}
                <button class="remove-btn" data-index="${index}">❌</button>
            `;
            orderItemsElement.appendChild(li);
        });

        localStorage.setItem("currentOrder", JSON.stringify(orderList));
        localStorage.setItem("totalPrice", totalPrice);
    }

    proceedCheckout.addEventListener("click", function() {
        if (orderList.length === 0) {
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
        
        localStorage.setItem("currentOrder", JSON.stringify(orderList));
        localStorage.setItem("totalPrice", totalPrice);
        
        animatePageExit("checkoutD.html");
    });

    function loadOrder() {
        const savedOrderList = JSON.parse(localStorage.getItem("currentOrder")) || [];
        const savedTotalPrice = parseFloat(localStorage.getItem("totalPrice")) || 0;

        orderList = savedOrderList;
        totalPrice = savedTotalPrice;

        updateOrderList();
    }

    initializeMenuItems();
    loadOrder();
});