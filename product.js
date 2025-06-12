const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxqy3TZk6BzoikhbAjmvd5aOMKenHe0AGY_NOTaPKY0P9czcQg4rBI-EMi-3v5G9yPfrA/exec';

document.addEventListener('DOMContentLoaded', () => {
    renderProductVariants();
});

function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId, variant) {
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
    const variantListings = document.getElementById('variant-listings');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    console.log('Product ID from URL:', productId);

    if (!productId) {
        variantListings.innerHTML = '<p class="error-message">No product ID specified.</p>';
        return;
    }

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL);
        if (!response.ok) throw new Error('Failed to fetch product data');
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
        });

        // Add event listeners for Add to Cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-idx');
                const selectedVariant = variants[idx];
                addToCart(productId, selectedVariant);
            });
        });

    } catch (err) {
        variantListings.innerHTML = '<p class="error-message">Error loading product.</p>';
        console.error(err);
    }