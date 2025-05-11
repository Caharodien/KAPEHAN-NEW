document.addEventListener("DOMContentLoaded", function () {
    const takeoutBtn = document.getElementById("takeout");
    const dineinBtn = document.getElementById("dinein");
    const body = document.body;

    function navigateWithAnimation(targetPage, direction) {
        body.classList.add(direction); // Apply the correct slide animation
        setTimeout(() => {
            window.location.href = targetPage;
        }, 500); // Match duration with CSS animation
    }

    takeoutBtn.addEventListener("click", function () {
        navigateWithAnimation("takeoutmenu.html", "slide-right"); // Takeout slides right
    });

    dineinBtn.addEventListener("click", function () {
        navigateWithAnimation("dinemenu.html", "slide-left"); // Dine-in slides left
    });
});
