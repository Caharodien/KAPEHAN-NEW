document.addEventListener("DOMContentLoaded", function () {
    const takeoutBtn = document.getElementById("takeout");
    const dineinBtn = document.getElementById("dinein");
    const body = document.body;

    function navigateWithAnimation(targetPage, direction) {
        body.classList.add(direction); 
        setTimeout(() => {
            window.location.href = targetPage;
        }, 500);
    }

    takeoutBtn.addEventListener("click", function () {
        navigateWithAnimation("takeoutmenu.html", "slide-right"); 
    });

    dineinBtn.addEventListener("click", function () {
        navigateWithAnimation("dinemenu.html", "slide-left"); 
    });
});