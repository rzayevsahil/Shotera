document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.add('scrolled');
            navbar.classList.remove('scrolled');
        }
    });

    // Initial check
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    }

    // 2. OS Detection for Primary Download Button
    const osNameSpan = document.getElementById('os-name');
    const autoDownloadBtn = document.getElementById('auto-download-btn');
    
    let osName = "Windows";
    let downloadLink = "https://github.com/rzayevsahil/Shotera/releases/latest";

    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf("mac") !== -1) {
        osName = "macOS";
    } else if (userAgent.indexOf("linux") !== -1 || userAgent.indexOf("ubuntu") !== -1) {
        osName = "Linux";
    }

    osNameSpan.textContent = osName;

    // 3. Intersection Observer for Fade-in Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(element => {
        observer.observe(element);
    });
});
