// =================================================================================
// BACKGROUND ANIMATIONS (Stars & Plexus)
// =================================================================================

const starsCanvas = document.getElementById('stars-bg');
const plexusCanvas = document.getElementById('plexus-bg');
const starsCtx = starsCanvas.getContext('2d');
const plexusCtx = plexusCanvas.getContext('2d');
let stars = [];
let particles = [];
let mouse = { x: null, y: null, radius: 150 };

class Star {
    constructor(x, y, radius, alpha) {
        this.x = x; this.y = y; this.radius = radius; this.alpha = alpha;
        this.initialAlpha = alpha; this.twinkleSpeed = Math.random() * 0.015 + 0.005;
    }
    draw() {
        starsCtx.beginPath();
        starsCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        starsCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        starsCtx.fill();
    }
    update() {
        this.alpha += this.twinkleSpeed;
        if (this.alpha > this.initialAlpha || this.alpha < 0.1) {
            this.twinkleSpeed = -this.twinkleSpeed;
        }
        this.draw();
    }
}

function initStars() {
    const numberOfStars = (starsCanvas.width * starsCanvas.height) / 8000;
    for (let i = 0; i < numberOfStars; i++) {
        stars.push(new Star(Math.random() * starsCanvas.width, Math.random() * starsCanvas.height, Math.random() * 1.2, Math.random() * 0.5 + 0.2));
    }
}

function animateStars() {
    requestAnimationFrame(animateStars);
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    stars.forEach(star => star.update());
}

function resizeStarsCanvas() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
    stars = [];
    initStars();
}

class Particle {
    constructor(x, y, dX, dY, size, color) {
        this.x = x; this.y = y; this.directionX = dX; this.directionY = dY;
        this.size = size; this.color = color;
    }
    draw() {
        plexusCtx.beginPath();
        plexusCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        plexusCtx.fillStyle = this.color;
        plexusCtx.fill();
    }
    update() {
        if (this.x > plexusCanvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > plexusCanvas.height || this.y < 0) this.directionY = -this.directionY;
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function initPlexus() {
    const numParticles = (plexusCanvas.width * plexusCanvas.height) / 12000;
    for (let i = 0; i < numParticles; i++) {
        let size = Math.random() * 1.5 + 0.5;
        particles.push(new Particle(Math.random() * (innerWidth - size * 2) + size * 2, Math.random() * (innerHeight - size * 2) + size * 2, Math.random() * 0.3 - 0.15, Math.random() * 0.3 - 0.15, size, 'rgba(200,220,255,0.6)'));
    }
}

function connectPlexus() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let distance = ((particles[a].x - particles[b].x) ** 2) + ((particles[a].y - particles[b].y) ** 2);
            if (distance < (plexusCanvas.width / 8) * (plexusCanvas.height / 8)) {
                let opacity = 1 - (distance / 25000);
                let mouseDist = Math.sqrt((mouse.x - particles[a].x) ** 2 + (mouse.y - particles[a].y) ** 2);
                plexusCtx.strokeStyle = (mouseDist < mouse.radius) ? `rgba(220,230,255,${opacity * 0.5})` : `rgba(200,220,255,${opacity * 0.25})`;
                plexusCtx.lineWidth = 0.8;
                plexusCtx.beginPath();
                plexusCtx.moveTo(particles[a].x, particles[a].y);
                plexusCtx.lineTo(particles[b].x, particles[b].y);
                plexusCtx.stroke();
            }
        }
    }
}

function animatePlexus() {
    requestAnimationFrame(animatePlexus);
    plexusCtx.clearRect(0, 0, plexusCanvas.width, plexusCanvas.height);
    particles.forEach(p => p.update());
    connectPlexus();
}

function resizePlexusCanvas() {
    plexusCanvas.width = window.innerWidth;
    plexusCanvas.height = window.innerHeight;
    particles = [];
    initPlexus();
}

// =================================================================================
// GLOBAL EVENT LISTENERS
// =================================================================================

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseout', () => {
    mouse.x = undefined;
    mouse.y = undefined;
});
window.addEventListener('resize', () => {
    resizeStarsCanvas();
    resizePlexusCanvas();
    updateScrollbarWidth();
});

// زرار السكرول الي الاعلي

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const contentWrapper = document.querySelector('.content-wrapper');

    function updateScrollbarWidth() {
        if (!contentWrapper) return;
        const scrollbarWidth = contentWrapper.offsetWidth - contentWrapper.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
    }

    const openNavBtn = document.getElementById('menu-btn');
    const sidenav = document.getElementById('mySidenav');
    const closeNavBtn = document.getElementById('closeNavBtn');
    if (openNavBtn && sidenav && closeNavBtn) {
        openNavBtn.addEventListener('click', () => { sidenav.classList.add('open'); });
        closeNavBtn.addEventListener('click', () => { sidenav.classList.remove('open'); });
    }

    const allNavLinks = document.querySelectorAll('nav a, .sidenav-links a');

    allNavLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // لو الرابط يبدأ بـ #
            if (targetId.startsWith('#')) {
                e.preventDefault();

                const targetElement = document.querySelector(targetId);

                allNavLinks.forEach(link => link.classList.remove('active'));
                document.querySelectorAll(`a[href="${targetId}"]`).forEach(link => link.classList.add('active'));

                if (sidenav && sidenav.classList.contains('open')) {
                    sidenav.classList.remove('open');
                }

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            // غير كده (رابط لصفحة تانية) → سيبه يشتغل عادي
        });
    });


    const sections = document.querySelectorAll('main section[id]');
    const observerOptions = {
        root: contentWrapper,
        rootMargin: '-40% 0px -60% 0px',
        threshold: 0
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                allNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    sections.forEach(section => observer.observe(section));

    // --- Search Logic ---
    const filter = document.getElementById('searchbox');
    const list = document.getElementById('list');
    const searchBtn = document.getElementById("searchBtn");
    const searchContainer = filter.closest('.box');
    let dataItems = [];

    async function loadData() {
        try {
            // FIX: Using the correct data file for suggestions
            const response = await fetch('public/searchpro/data.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            dataItems = await response.json();
        } catch (error) { console.error('Failed to load search data:', error); }
    }

    function updateSearchView() {
        const searchTerm = filter.value.toLowerCase().trim();
        list.innerHTML = '';
        if (!searchTerm) { list.style.display = 'none'; return; }
        const filtered = dataItems.filter(item => item.Title && item.Title.toLowerCase().includes(searchTerm)).slice(0, 5);
        if (filtered.length > 0) {
            filtered.forEach(item => {
                const li = document.createElement('li');
                const itemName = item.Title;
                const regex = new RegExp(`(${searchTerm})`, 'ig');
                li.innerHTML = itemName.replace(regex, `<span class="highlight">$1</span>`);
                li.dataset.link = `public/searchpro/details.html?id=${item.Id}`; // Link to details page
                list.appendChild(li);
            });
            list.style.display = 'block';
        } else {
            list.style.display = 'none';
        }
    }

    function redirectToSearchResults() {
        const query = filter.value.trim();
        if (query) {
            const encodedQuery = encodeURIComponent(query);
            window.location.href = `public/searchpro/pagsearch.html?q=${encodedQuery}`;
        }
    }

    // --- Event Listeners for Search ---
    list.addEventListener('click', e => {
        const item = e.target.closest('li');
        if (item) {
            filter.value = item.textContent;
            redirectToSearchResults();
        }
    });

    if (searchBtn) {
        searchBtn.addEventListener("click", redirectToSearchResults);
    }

    filter.addEventListener('keyup', updateSearchView);
    filter.addEventListener('focus', updateSearchView);
    filter.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            redirectToSearchResults();
        }
    });

    document.addEventListener('click', e => {
        if (!searchContainer.contains(e.target)) list.style.display = 'none';
    });

    loadData();

    // --- Initialize Everything ---
    updateScrollbarWidth();
    resizeStarsCanvas();
    resizePlexusCanvas();
    animateStars();
    animatePlexus();
});