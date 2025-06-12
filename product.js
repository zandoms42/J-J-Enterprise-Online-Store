const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxqy3TZk6BzoikhbAjmvd5aOMKenHe0AGY_NOTaPKY0P9czcQg4rBI-EMi-3v5G9yPfrA/exec';

console.log('product.js loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');
    renderProductVariants();
});

function getCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('Current cart:', cart);
    return cart;
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved:', cart);
}

function addToCart(productId, variant) {
    console.log('Adding to cart:', { productId, variant });
    const cart = getCart();
    cart.push({
        productId,
        variant1: variant.variant1 || null,
        variant2: variant.variant2 || null,
        quantity: 1
    });
    saveCart(cart);
    alert('Added to cart!');
}

async function renderProductVariants() {
    console.log('renderProductVariants called');
    const variantListings = document.getElementById('variant-listings');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    console.log('Product ID from URL:', productId);

    if (!productId) {
        variantListings.innerHTML = '<p class="error-message">No product ID specified.</p>';
        console.warn('No product ID specified in URL.');
        return;
    }

    try {
        console.log('Fetching product data from:', GOOGLE_SHEET_API_URL);
        const response = await fetch(GOOGLE_SHEET_API_URL);
        console.log('Fetch response:', response);

        if (!response.ok) {
            console.error('Fetch failed with status:', response.status);
            throw new Error('Failed to fetch product data');
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        // Find all rows with the matching product ID (loose equality for type mismatch)
        const variants = data.filter(item => {
            console.log('Comparing item.id:', item.id, 'to productId:', productId);
            return item.id == productId;
        });

        console.log('Filtered variants:', variants);

        if (!variants.length) {
            variantListings.innerHTML = '<p class="error-message">Product not found.</p>';
            console.warn('No variants found for productId:', productId);
            return;
        }

        // Use the first variant for general product info
        const product = variants[0];
        variantListings.innerHTML = '';

        variants.forEach((variant, idx) => {
            const imageUrl = variant.image && variant.image.startsWith('http')
                ? variant.image
                : `https://placehold.co/200x200/cccccc/333333?text=${encodeURIComponent(product.itemName ? product.itemName.substring(0, 10) : 'No+Name')}`;

            const variantName = [variant.variant1, variant.variant2].filter(Boolean).join(' / ') || 'Default';

            const card = document.createElement('div');
            card.className = 'product-card';

            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.itemName || 'Product'}" class="product-image"
                        onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/333333?text=Image+N/A';">
                </div>
                <div class="product-content">
                    <h3>${product.itemName || 'No Name'}</h3>
                    <p>${product.description || ''}</p>
                    <p class="variant-info"><strong>Variant:</strong> ${variantName}</p>
                    <div class="price-info">${variant.unitSale ? "$" + Number(variant.unitSale).toFixed(2) : ''}</div>
                    <p class="stock-info">Stock: <span class="${Number(variant.Stock) <= 0 ? 'out-of-stock-label' : ''}">
                        ${variant.Stock || 0}
                    </span></p>
                    <button class="add-to-cart-btn" data-idx="${idx}">Add to Cart</button>
                </div>
            `;

            variantListings.appendChild(card);
            console.log('Rendered card for variant:', variant);
        });

        // Add event listeners for Add to Cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-idx');
                const selectedVariant = variants[idx];
                console.log('Add to Cart button clicked for idx:', idx, 'variant:', selectedVariant);
                addToCart(productId, selectedVariant);
            });
        });

        console.log('All variant cards rendered and event listeners attached.');

    } catch (err) {
        variantListings.innerHTML = '<p class="error-message">Error loading product.</p>';
        console.error('Error in renderProductVariants:', err);
    }
}