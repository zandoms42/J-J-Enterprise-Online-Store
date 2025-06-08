// **IMPORTANT:** Replace this URL with your actual Google Apps Script Web App URL
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxqy3TZk6BzoikhbAjmvd5aOMKenHe0AGY_NOTaPKY0P9czcQg4rBI-EMi-3v5G9yPfrA/exec';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

// Cache the fetched product listings (still useful even without a cart for future additions)
let productListingsCache = [];

// --- Product Fetching and Display ---
async function fetchProducts() {
    const productListings = document.getElementById('product-listings');
    productListings.innerHTML = '<p class="loading-message">Loading products...</p>';

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        productListingsCache = data; // Populate the cache

        console.log("Fetched Data:", data); // For debugging purposes

        if (!data || data.length === 0) {
            productListings.innerHTML = '<p class="loading-message">No products found.</p>';
            return;
        }

        productListings.innerHTML = ''; // Clear loading message

        // Process data for display - Each row from the sheet is a distinct item/variant
        data.forEach(item => {
            // Skip rows without an item name or if it's potentially a blank row from the sheet
            if (!item.itemName || item.itemName === '') {
                return;
            }

            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            // Determine effective price for display
            const originalPrice = parseFloat(item.unitSale);
            // discountPrice might be null or 0 if no discount is set in the sheet
            const discountPrice = parseFloat(item.discountPrice); 
            const displayPrice = (discountPrice !== null && !isNaN(discountPrice) && discountPrice < originalPrice) ? discountPrice : originalPrice;
            const isDiscounted = (discountPrice !== null && !isNaN(discountPrice) && discountPrice < originalPrice);

            let priceHtml = '';
            if (isDiscounted) {
                priceHtml = `<span class="original-price">$${originalPrice.toFixed(2)}</span> <span class="discounted-price">$${displayPrice.toFixed(2)}</span>`;
                // Add a "SALE" badge if discounted
                const saleBadge = document.createElement('div');
                saleBadge.classList.add('sale-badge');
                saleBadge.textContent = 'SALE!';
                productCard.appendChild(saleBadge);
            } else {
                priceHtml = `$${originalPrice.toFixed(2)}`;
            }

            // Fallback for image if URL is missing or broken
            // Using a dynamic placeholder based on item name if no image is provided
            // Takes first 10 characters of item name for placeholder text
            const imageUrl = item.image && item.image.startsWith('http') ? item.image : `https://placehold.co/200x200/cccccc/333333?text=${encodeURIComponent(item.itemName.substring(0, Math.min(item.itemName.length, 10)))}`;

            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${item.itemName}" class="product-image" onerror="this.onerror=null;this.src='https://placehold.co/200x200/cccccc/333333?text=Image+N/A';">
                </div>
                <div class="product-content">
                    <h3>${item.itemName}</h3>
                    <p>${item.description || 'No description available.'}</p>
                    ${item.variant1 || item.variant2 ? `<p class="product-variants-display">
                        ${item.variant1 ? `<strong>${item.variant1}</strong>` : ''}
                        ${item.variant1 && item.variant2 ? `, ` : ''}
                        ${item.variant2 ? `<strong>${item.variant2}</strong>` : ''}
                    </p>` : ''}
                    <div class="price-info">${priceHtml}</div>
                    <p class="stock-info">Stock: <span class="${item.currentOnHand <= 0 ? 'out-of-stock-label' : ''}">${item.currentOnHand !== null ? item.currentOnHand : 'N/A'}</span></p>
                    <!-- Removed Add to Cart button as no cart functionality in this minimal version -->
                </div>
            `;

            productListings.appendChild(productCard);
        });

    } catch (error) {
        productListings.innerHTML = '<p class="loading-message error-message">Error loading products. Please try again later.</p>';
        console.error("Failed to fetch products:", error);
        // Removed showAlert as there's no modal in this minimal version
    }
}
