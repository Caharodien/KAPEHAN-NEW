document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.logo');
    
    if (logo) {
        logo.addEventListener('click', function() {
            const rect = logo.getBoundingClientRect();
            const startX = rect.left;
            const startY = rect.top;
            
            logo.style.position = 'fixed';
            logo.style.left = startX + 'px';
            logo.style.top = startY + 'px';
            logo.style.width = rect.width + 'px';
            logo.style.height = rect.height + 'px';
            logo.style.margin = '0';
            
            logo.classList.add('exit-animation');
            
            setTimeout(() => {
                window.location.href = 'd&t.html';
            }, 800);
        });
    }
});