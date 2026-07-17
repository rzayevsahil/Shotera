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

    // 4. Fetch Latest Release Assets from GitHub API for direct downloads
    fetch('https://api.github.com/repos/rzayevsahil/Shotera/releases/latest')
        .then(res => res.json())
        .then(data => {
            if (!data || !data.assets) return;
            const assets = data.assets;
            
            let msiUrl = "", exeUrl = "", dmgUrl = "", tarUrl = "", debUrl = "", appImageUrl = "";
            
            assets.forEach(asset => {
                const name = asset.name.toLowerCase();
                if (name.endsWith('.msi')) msiUrl = asset.browser_download_url;
                else if (name.endsWith('.exe')) exeUrl = asset.browser_download_url;
                else if (name.endsWith('.dmg')) dmgUrl = asset.browser_download_url;
                else if (name.endsWith('app.tar.gz')) tarUrl = asset.browser_download_url;
                else if (name.endsWith('.deb')) debUrl = asset.browser_download_url;
                else if (name.endsWith('.appimage')) appImageUrl = asset.browser_download_url;
            });

            // Set hrefs to direct downloads
            if (msiUrl) document.getElementById('win-msi-btn').href = msiUrl;
            if (exeUrl) document.getElementById('win-exe-btn').href = exeUrl;
            if (dmgUrl) document.getElementById('mac-dmg-btn').href = dmgUrl;
            if (tarUrl) document.getElementById('mac-tar-btn').href = tarUrl;
            if (debUrl) document.getElementById('linux-deb-btn').href = debUrl;
            if (appImageUrl) document.getElementById('linux-appimage-btn').href = appImageUrl;
            
            // Set the dynamic hero button download link
            if (osName === "Windows" && msiUrl) autoDownloadBtn.href = msiUrl;
            else if (osName === "macOS" && dmgUrl) autoDownloadBtn.href = dmgUrl;
            else if (osName === "Linux" && debUrl) autoDownloadBtn.href = debUrl;
        })
        .catch(err => console.error("Failed to fetch GitHub releases:", err));
});
