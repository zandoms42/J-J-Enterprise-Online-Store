const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxqy3TZk6BzoikhbAjmvd5aOMKenHe0AGY_NOTaPKY0P9czcQg4rBI-EMi-3v5G9yPfrA/exec';

let productListingsCache = [];
let productsPerPage = 20;
let currentOffset = 0;

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

async function fetchProducts() {
    const productListings = document.getElementById('product-listings');
    const loadMoreButton = document.getElementById('load-more-button');

    if (!productListings) {
        console.error('Error: #product-listings element not found.');
        return;
    }

    productListings.innerHTML = '<p class="loading-message">Loading products...</p>';

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            productListings.innerHTML = '<p>No products found.</p>';
            return;
        }

        // --- Group and sanitize data ---
        const grouped = new Map();
        const cleanNumber = (val) => {
            if (val == null || val === '') return 0;
            const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
            return isNaN(num) ? 0 : num;
        };

        for (const item of data) {
            if (!item.id) continue;

            // Sanitize image: ensure string or empty string
            const imageSafe = typeof item.image === 'string' ? item.image.trim() : '';

            const id = item.id;
            const product = {
                id,
                itemName: item.itemName?.trim() || 'Unnamed Item',
                description: item.description || '',
                image: imageSafe,
                unitSale: cleanNumber(item.unitSale),
                discountPrice: cleanNumber(item.discountPrice),
                currentOnHand: cleanNumber(item.currentOnHand),
                variants: [],
            };

            if (item.variant1 || item.variant2) {
                product.variants.push({
                    variant1: item.variant1 || null,
                    variant2: item.variant2 || null,
                });
            }

            if (grouped.has(id)) {
                const existing = grouped.get(id);
                const variantKey = (v) => `${v.variant1 ?? ''}|${v.variant2 ?? ''}`;
                const existingKeys = new Set(existing.variants.map(variantKey));
                for (const v of product.variants) {
                    if (!existingKeys.has(variantKey(v))) {
                        existing.variants.push(v);
                    }
                }
            } else {
                grouped.set(id, product);
            }
        }

        productListings.innerHTML = '';
        productListingsCache = Array.from(grouped.values());
        currentOffset = 0;

        renderNextBatch();

        if (loadMoreButton) {
            loadMoreButton.style.display = productListingsCache.length > productsPerPage ? 'block' : 'none';
            loadMoreButton.onclick = renderNextBatch;
        }

    } catch (err) {
        productListings.innerHTML = '<p class="error-message">Error loading products.</p>';
        console.error("Error during product fetch:", err);
    }
}

function renderNextBatch() {
    const productListings = document.getElementById('product-listings');
    const loadMoreButton = document.getElementById('load-more-button');

    const slice = productListingsCache.slice(currentOffset, currentOffset + productsPerPage);
    slice.forEach(product => {
        const productCard = document.createElement('button');
        productCard.classList.add('product-card');
        productCard.onclick = () => {
            window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
        };

        const isDiscounted = product.discountPrice > 0 && product.discountPrice < product.unitSale;
        const displayPrice = isDiscounted ? product.discountPrice : product.unitSale;
        const priceHtml = isDiscounted
            ? `<span class="original-price">$${product.unitSale.toFixed(2)}</span> <span class="discounted-price">$${displayPrice.toFixed(2)}</span>`
            : `$${displayPrice.toFixed(2)}`;

        // Defensive check: convert to string and trim
        const imageStr = String(product.image || '').trim();
        const imageUrl = imageStr.startsWith('http')
            ? imageStr
            : `https://placehold.co/200x200/cccccc/333333?text=${encodeURIComponent(product.itemName.substring(0, 10))}`;

        if (isDiscounted) {
            const saleBadge = document.createElement('div');
            saleBadge.classList.add('sale-badge');
            saleBadge.textContent = 'SALE!';
            productCard.appendChild(saleBadge);
        }

        const variantList = product.variants.map(v => {
            const v1 = v.variant1 ? `<strong>${v.variant1}</strong>` : '';
            const v2 = v.variant2 ? `<strong>${v.variant2}</strong>` : '';
            return `<li>${v1}${v1 && v2 ? ', ' : ''}${v2}</li>`;
        }).join('');

        productCard.innerHTML += `
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${product.itemName}" class="product-image"
                     onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/333333?text=Image+N/A';">
            </div>
            <div class="product-content">
                <h3>${product.itemName}</h3>
                <p>${product.description}</p>
                ${variantList ? `<ul class="product-variants-display">${variantList}</ul>` : ''}
                <div class="price-info">${priceHtml}</div>
                <p class="stock-info">Stock: <span class="${product.currentOnHand <= 0 ? 'out-of-stock-label' : ''}">
                    ${product.currentOnHand}
                </span></p>
            </div>
        `;

        productListings.appendChild(productCard);
    });

    currentOffset += productsPerPage;

    if (currentOffset >= productListingsCache.length && loadMoreButton) {
        loadMoreButton.style.display = 'none';
    }
}
