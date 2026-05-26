// API Base Configuration
const API_URL = 'http://localhost:5000/api';

// State Management
const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    cart: JSON.parse(localStorage.getItem('cart')) || [],
};

// DOM Elements
const featuredProductsContainer = document.getElementById('featured-products');
const authLinks = document.getElementById('auth-links');
const userMenu = document.getElementById('user-menu');
const userName = document.getElementById('user-name');
const cartCountElements = document.querySelectorAll('.cart-count');
const searchInput = document.querySelector('.search-bar input');
const searchBtn = document.querySelector('.search-bar button');

// Initialize App
const init = async () => {
    updateAuthUI();
    updateCartUI();
    fetchFeaturedProducts();
    setupEventListeners();
    setupScrollAnimations();
    setupNavbarEffect();
};

// --- UI Components ---

// Toast System
const showToast = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

// Auth UI Logic
const updateAuthUI = () => {
    if (!authLinks || !userMenu) return;
    if (state.user) {
        authLinks.classList.add('hidden');
        userMenu.classList.remove('hidden');
        if (userName) userName.textContent = state.user.name.split(' ')[0];
    } else {
        authLinks.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
};

// Cart UI Logic
const updateCartUI = () => {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountElements.forEach(el => el.textContent = totalItems);
    localStorage.setItem('cart', JSON.stringify(state.cart));
};

// --- Data Fetching ---

// Fetch Products from Backend
const fetchFeaturedProducts = async (category = null, search = '') => {
    if (featuredProductsContainer) {
        featuredProductsContainer.innerHTML = `
            <div class="loading-grid" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>Curating your collection...</p>
            </div>
        `;
    }

    try {
        let url = `${API_URL}/products?limit=8`;
        if (category) url += `&category=${category}`;
        if (search) url += `&search=${search}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            renderProducts(data.data);
        } else {
            if (featuredProductsContainer) featuredProductsContainer.innerHTML = `<p class="error">Failed to load products</p>`;
        }
    } catch (err) {
        console.error('Error fetching products:', err);
        // Fallback for demo if server not started
        renderProducts(getMockProducts());
    }
};

// Render Product Cards
const renderProducts = (products) => {
    if (!featuredProductsContainer) return;
    
    if (products.length === 0) {
        featuredProductsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No products found matching your criteria.</p>';
        return;
    }

    featuredProductsContainer.innerHTML = products.map(product => `
        <div class="product-card reveal">
            <div class="product-image">
                <img src="${product.image.startsWith('http') ? product.image : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'}" alt="${product.name}" loading="lazy">
                ${product.price < 100 ? '<span class="product-tag">Best Value</span>' : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-add-cart" data-id="${product._id}">
                        <i class="ph ph-shopping-cart-simple"></i> Add
                    </button>
                    <a href="product.html?id=${product._id}" class="btn btn-outline">
                        <i class="ph ph-eye"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // Trigger reveal animation for new items
    setTimeout(setupScrollAnimations, 100);

    // Add event listeners to buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const product = products.find(p => p._id === id);
            if (product) addToCart(product);
        });
    });
};

// --- Features ---

// Add to Cart Functionality
const addToCart = (product) => {
    const existing = state.cart.find(item => item.product === product._id);
    if (existing) {
        existing.qty += 1;
    } else {
        state.cart.push({
            product: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            qty: 1
        });
    }
    updateCartUI();
    showToast(`${product.name} added to cart!`);
};

// Setup Event Listeners
const setupEventListeners = () => {
    // Search logic
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const term = searchInput.value.trim();
            if (window.location.pathname.includes('shop.html')) {
                // If on shop page, fetch directly
                window.dispatchEvent(new CustomEvent('shop-search', { detail: term }));
            } else {
                // Redirect to shop with search param
                window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchBtn.click();
        });
    }

    // Category click listeners
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            window.location.href = `shop.html?category=${encodeURIComponent(category)}`;
        });
    });
};

// Setup Scroll Animations
const setupScrollAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};

// Setup Navbar Effect
const setupNavbarEffect = () => {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
};

// Mock Products for fallback
const getMockProducts = () => [
    { _id: '1', name: 'Premium Wireless Headphones', price: 199.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
    { _id: '2', name: 'Minimalist Leather Watch', price: 129.50, category: 'Fashion', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
    { _id: '3', name: 'Smart Fitness Tracker', price: 89.00, category: 'Electronics', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=400' },
    { _id: '4', name: 'Organic Cotton Hoodie', price: 65.00, category: 'Fashion', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400' }
];

// Kick off
document.addEventListener('DOMContentLoaded', init);
