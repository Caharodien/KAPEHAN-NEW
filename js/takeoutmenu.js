document.addEventListener('DOMContentLoaded', function() {
    // API Base URL - Update this to match your backend server port
    const API_BASE_URL = 'http://localhost:3001/api/menu';
    
    // Menu state
    let menuItems = [];
    let orderList = [];
    let totalPrice = 0;

    // DOM elements
    const hotTab = document.getElementById('hot-tab');
    const coldTab = document.getElementById('cold-tab');
    const hotMenu = document.getElementById('hot-menu');
    const coldMenu = document.getElementById('cold-menu');
    const orderItemsElement = document.getElementById('order-items');
    const totalPriceElement = document.getElementById('total-price');
    const proceedCheckout = document.getElementById('proceed-checkout');
    const startAgainButton = document.getElementById('start-again');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    const container = document.body; // Assuming container is the body element

    // Verify all DOM elements exist to prevent null assertions
    if (!hotTab || !coldTab || !hotMenu || !coldMenu || !orderItemsElement || 
        !totalPriceElement || !proceedCheckout || !startAgainButton || 
        !confirmModal || !confirmYes || !confirmNo) {
        console.error('Error: One or more required DOM elements not found');
        return; // Exit early
    }

    // Load saved order from session storage
    loadOrder();

    // Initialize menu items from database
    initializeMenuItems();

    // Set up tab switching
    hotTab.addEventListener('click', function() {
        hotTab.classList.add('active');
        coldTab.classList.remove('active');
        hotMenu.style.display = 'grid';
        coldMenu.style.display = 'none';
    });

    coldTab.addEventListener('click', function() {
        coldTab.classList.add('active');
        hotTab.classList.remove('active');
        coldMenu.style.display = 'grid';
        hotMenu.style.display = 'none';
    });

    // Start again button
    startAgainButton.addEventListener('click', function() {
        confirmModal.style.display = 'flex';
    });

    confirmYes.addEventListener('click', function() {
        sessionStorage.removeItem('takeoutOrder');
        window.location.href = 'index.html';
    });

    confirmNo.addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });

    // Proceed to checkout
    proceedCheckout.addEventListener('click', function() {
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
        
        animatePageExit("checkoutT.html");
    });

    // Update the fetchMenuItems function to match dinemenu.js
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

    // Initialize menu items
    async function initializeMenuItems() {
        try {
            menuItems = await fetchMenuItems();
            
            if (!Array.isArray(menuItems) || menuItems.length === 0) {
                console.error("No menu items loaded from database or invalid response format");
                return;
            }
            
            // Clear existing static menu items
            if (hotMenu) hotMenu.innerHTML = '';
            if (coldMenu) coldMenu.innerHTML = '';
            
            // Display the menu items
            displayMenuItems();
            
            // Set up click handlers for the new menu items
            setupMenuItemClickHandlers();
        } catch (error) {
            console.error("Error initializing menu items:", error);
        }
    }

    // Display menu items
    function displayMenuItems() {
        if (!Array.isArray(menuItems)) return;
        
        menuItems.forEach(item => {
            if (!item || typeof item !== 'object') return;
            
            try {
                const menuItemElement = createMenuItemElement(item);
                
                // Check category exists and is a string
                const category = item.category && typeof item.category === 'string' 
                    ? item.category.toLowerCase() 
                    : '';
                
                // Add to hot or cold menu based on category
                if (category === 'hot' && hotMenu) {
                    hotMenu.appendChild(menuItemElement);
                } else if (category === 'cold' && coldMenu) {
                    coldMenu.appendChild(menuItemElement);
                }
            } catch (error) {
                console.error("Error displaying menu item:", error, item);
            }
        });
    }

    // Create a menu item element
    function createMenuItemElement(item) {
        if (!item) throw new Error("Item is null or undefined");
        
        const div = document.createElement('div');
        div.className = 'item';
        
        // Set data attributes safely
        if (item.menu_item_id) div.dataset.id = item.menu_item_id;
        if (item.name) div.dataset.name = item.name;
        if (item.price !== undefined) div.dataset.price = item.price;
        
        // Format price safely
        const price = item.price !== undefined ? parseFloat(item.price) : 0;
        const formattedPrice = !isNaN(price) ? price.toFixed(2) : '0.00';
        
        // Create HTML content safely
        div.innerHTML = `
            <img src="${item.image_url ? '../images/' + item.image_url : '../images/default.png'}" 
                 alt="${item.name || 'Coffee Item'}" 
                 onerror="this.src='../images/default.png'">
            <p>${item.name || 'Unnamed Item'}</p>
            <div class="description">${item.description || 'No description available'}</div>
            <div class="price">$${formattedPrice}</div>
        `;
        
        return div;
    }

    // Set up click handlers for menu items
    function setupMenuItemClickHandlers() {
        const itemElements = document.querySelectorAll('.item');
        itemElements.forEach(item => {
            item.addEventListener('click', function() {
                const name = this.dataset.name;
                const priceStr = this.dataset.price;
                
                // Validate data attributes
                if (!name) {
                    console.error('Item name is missing');
                    return;
                }
                
                // Parse price safely
                const price = priceStr ? parseFloat(priceStr) : 0;
                if (isNaN(price)) {
                    console.error('Invalid price format:', priceStr);
                    return;
                }
                
                addToOrder(name, price);
            });
        });
    }

    // Add item click handler
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

    // Add event handler for remove buttons in order list
    orderItemsElement.addEventListener("click", function(e) {
        if (e.target.classList.contains("remove-btn")) {
            const index = parseInt(e.target.dataset.index);
            removeFromOrder(index);
        }
    });

    // Add removeFromOrder function
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

    // Update the updateOrderList function
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

    // Also fix the loadOrder function
    function loadOrder() {
        try {
            const savedOrder = localStorage.getItem("currentOrder");
            const savedTotalPrice = localStorage.getItem("totalPrice");
            if (savedOrder) {
                orderList = JSON.parse(savedOrder);
            }
            if (savedTotalPrice) {
                totalPrice = parseFloat(savedTotalPrice);
            }
            updateOrderList();
        } catch (error) {
            console.error('Error loading saved order:', error);
            // Reset to empty order if there's an error
            orderList = [];
            totalPrice = 0;
        }
    }

    // Animation for page exit
    function animatePageExit(destination) {
        container.style.animation = "slideUpExit 0.5s ease-out forwards";
        
        setTimeout(() => {
            window.location.href = destination;
        }, 500);
    }
});