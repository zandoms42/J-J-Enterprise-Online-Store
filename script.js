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

        const grouped = new Map();

        for (const item of data) {
            if (!item.id) continue;
            const id = item.id;

            const variantKey = `${item.variant1 || ''}|${item.variant2 || ''}`;

            if (!grouped.has(id)) {
                grouped.set(id, {
                    id,
                    itemName: item.itemName?.trim() || 'Unnamed Item',
                    description: item.description || '',
                    image: String(item.image || '').trim(),
                    unitSale: item.unitSale || '',
                    discountPrice: item.discountPrice || '',
                    currentOnHand: 0,
                    variantCount: 0
                });
            }

            const product = grouped.get(id);
            product.currentOnHand += Number(item.currentOnHand || 0);
            product.variantCount += 1;
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
        if (!product) return;

        const imageUrl = String(product.image || '').startsWith('http')
            ? product.image
            : `https://placehold.co/200x200/cccccc/333333?text=${encodeURIComponent(product.itemName.substring(0, 10))}`;

        const isDiscounted = product.discountPrice && product.discountPrice !== product.unitSale;
        const displayPrice = isDiscounted ? product.discountPrice : product.unitSale;

        const priceHtml = isDiscounted
            ? `<span class="original-price">${product.unitSale}</span> <span class="discounted-price">${displayPrice}</span>`
            : `${displayPrice}`;

        const productCard = document.createElement('button');
        productCard.classList.add('product-card');
        productCard.onclick = () => {
            window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
        };

        if (isDiscounted) {
            const saleBadge = document.createElement('div');
            saleBadge.classList.add('sale-badge');
            saleBadge.textContent = 'SALE!';
            productCard.appendChild(saleBadge);
        }

        productCard.innerHTML += `
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${product.itemName}" class="product-image"
                     onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/333333?text=Image+N/A';">
            </div>
            <div class="product-content">
                <h3>${product.itemName}</h3>
                <p>${product.description}</p>
                <p class="variant-count">Variants: ${product.variantCount}</p>
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
