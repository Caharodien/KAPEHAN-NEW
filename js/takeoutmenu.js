document.addEventListener('DOMContentLoaded', function() {
    // API Base URL - Update this to match your backend server port
    const API_BASE_URL = 'http://localhost:3001/api/menu';
    
    // Menu state
    let menuItems = [];
    let orderItems = [];
    let total = 0;

    // DOM elements
    const hotTab = document.getElementById('hot-tab');
    const coldTab = document.getElementById('cold-tab');
    const hotMenu = document.getElementById('hot-menu');
    const coldMenu = document.getElementById('cold-menu');
    const orderItemsList = document.getElementById('order-items');
    const totalPrice = document.getElementById('total-price');
    const proceedCheckout = document.getElementById('proceed-checkout');
    const startAgainButton = document.getElementById('start-again');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    // Verify all DOM elements exist to prevent null assertions
    if (!hotTab || !coldTab || !hotMenu || !coldMenu || !orderItemsList || 
        !totalPrice || !proceedCheckout || !startAgainButton || 
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
        if (orderItems.length === 0) {
            alert('Please add items to your order first');
            return;
        }
        sessionStorage.setItem('takeoutOrder', JSON.stringify({
            items: orderItems,
            total: total
        }));
        window.location.href = 'checkoutT.html';
    });

    async function fetchMenuItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/items`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("API response:", data); // For debugging
            
            // Extract the items array from the response object
            if (data && data.success === true && Array.isArray(data.items)) {
                console.log("Items found:", data.items.length);
                return data.items;
            } else if (Array.isArray(data)) {
                // In case API returns array directly
                console.log("Direct array response:", data.length);
                return data;
            } else {
                console.error("Unexpected API response format:", data);
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

    // Add item to order
    function addToOrder(name, price) {
        if (!name || typeof name !== 'string') {
            console.error('Invalid item name:', name);
            return;
        }
        
        if (isNaN(price) || price < 0) {
            console.error('Invalid price:', price);
            return;
        }
        
        // Check if item already exists in order
        const existingItemIndex = orderItems.findIndex(item => item.name === name);
        
        if (existingItemIndex !== -1) {
            // Item exists, increment quantity
            orderItems[existingItemIndex].quantity++;
            orderItems[existingItemIndex].subtotal += price;
        } else {
            // Add new item
            orderItems.push({
                name: name,
                price: price,
                quantity: 1,
                subtotal: price
            });
        }
        
        // Update total and UI
        total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        updateOrderList();
        
        // Save to session storage
        sessionStorage.setItem('takeoutOrder', JSON.stringify({
            items: orderItems,
            total: total
        }));
    }

    // Remove item from order
    function removeFromOrder(index) {
        if (!orderItems[index]) {
            console.error('Item not found at index:', index);
            return;
        }
        
        if (orderItems[index].quantity > 1) {
            // Decrease quantity
            orderItems[index].quantity--;
            orderItems[index].subtotal -= orderItems[index].price;
        } else {
            // Remove item
            orderItems.splice(index, 1);
        }
        
        // Update total and UI
        total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        updateOrderList();
        
        // Save to session storage
        sessionStorage.setItem('takeoutOrder', JSON.stringify({
            items: orderItems,
            total: total
        }));
    }

  // Update the updateOrderList function around line 317
function updateOrderList() {
    if (!orderItemsList) return;
    
    orderItemsList.innerHTML = '';
    
    orderItems.forEach((item, index) => {
        const li = document.createElement('li');
        
        // Format price and subtotal safely
        const price = !isNaN(item.price) ? parseFloat(item.price).toFixed(2) : '0.00';
        const subtotal = !isNaN(item.subtotal) ? parseFloat(item.subtotal).toFixed(2) : '0.00';
        
        li.innerHTML = `
            <div class="order-item-details">
                <span class="item-name">${item.name || 'Unknown item'}</span>
                <span class="item-price">$${price}</span>
            </div>
            <div class="quantity-controls">
                <button class="remove-item">-</button>
                <span class="quantity">${item.quantity || 0}</span>
                <span class="subtotal">$${subtotal}</span>
            </div>
        `;
        
        // Add remove event listener
        const removeButton = li.querySelector('.remove-item');
        if (removeButton) {
            removeButton.addEventListener('click', function(e) {
                e.stopPropagation();
                removeFromOrder(index);
            });
        }
        
        orderItemsList.appendChild(li);
    });
    
    // Fix the total price display - make sure total is a number
    if (totalPrice) {
        // Ensure total is a number before calling toFixed
        const formattedTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
        totalPrice.textContent = `$${formattedTotal}`;
    }
}

// Also fix the loadOrder function
function loadOrder() {
    try {
        const savedOrder = sessionStorage.getItem('takeoutOrder');
        if (savedOrder) {
            const orderData = JSON.parse(savedOrder);
            if (orderData && Array.isArray(orderData.items)) {
                orderItems = orderData.items;
                
                // Make sure total is parsed as a number
                total = typeof orderData.total === 'number' ? orderData.total : 
                       (typeof orderData.total === 'string' ? parseFloat(orderData.total) : 0);
                
                updateOrderList();
            }
        }
    } catch (error) {
        console.error('Error loading saved order:', error);
        // Reset to empty order if there's an error
        orderItems = [];
        total = 0;
    }
}

    // Animation for page exit
    function animatePageExit(destination) {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = destination;
        }, 500);
    }
});