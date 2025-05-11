document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.logo');
    
    if (logo) {
        logo.addEventListener('click', function() {
            // Get current position and dimensions
            const rect = logo.getBoundingClientRect();
            const startX = rect.left;
            const startY = rect.top;
            
            // Setup fixed positioning before animation
            logo.style.position = 'fixed';
            logo.style.left = startX + 'px';
            logo.style.top = startY + 'px';
            logo.style.width = rect.width + 'px';
            logo.style.height = rect.height + 'px';
            logo.style.margin = '0';
            
            // Apply exit animation class
            logo.classList.add('exit-animation');
            
            // Navigate after animation completes
            setTimeout(() => {
                window.location.href = 'd&t.html';
            }, 800);
        });
    }
});