const isMobile = window.matchMedia("(max-width: 768px)").matches;

const mobileWarning = document.getElementById('mobileWarning')




if (isMobile) {
    mobileWarning.classList.remove('disable')
}



