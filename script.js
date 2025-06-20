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

            if (!grouped.has(id)) {
                grouped.set(id, {
                    id,
                    itemName: item.itemName?.trim() || 'Unnamed Item',
                    description: item.description || '',
                    image: String(item.image || '').trim(),
                    unitSale: item.unitSale || '',
                    Stock: 0,
                    variants: [], // store variants here
                });
            }

            const product = grouped.get(id);
            product.Stock += Number(item.Stock || 0);

            // Collect variant info (variant1, variant2, or you can store the whole item)
            product.variants.push({
                variant1: item.variant1 || '',
                variant2: item.variant2 || '',
                // other variant-specific fields can go here
            });
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

        const imageUrl = product.image.startsWith('http')
            ? product.image
            : `https://placehold.co/200x200/cccccc/333333?text=${encodeURIComponent(product.itemName.substring(0, 10))}`;

        // Prepare the variant count HTML if there are multiple variants
        let variantCountHTML = '';
        if (product.variants.length > 1) {
            variantCountHTML = `<p class="variant-count">${product.variants.length} different variants available</p>`;
        }

        const productCard = document.createElement('button');
        productCard.classList.add('product-card');
        productCard.onclick = () => {
            window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
        };

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" alt="${product.itemName}" class="product-image"
                    onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/333333?text=Image+N/A';">
            </div>
            <div class="product-content">
                <h3>${product.itemName}</h3>
                <p>${product.description}</p>
                ${variantCountHTML}
                <div class="price-info">${"$" + product.unitSale.toFixed(2)}</div>
                <p class="stock-info">Stock: <span class="${product.Stock <= 0 ? 'out-of-stock-label' : ''}">
                    ${product.Stock}
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
