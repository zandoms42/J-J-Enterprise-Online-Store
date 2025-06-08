const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxqy3TZk6BzoikhbAjmvd5aOMKenHe0AGY_NOTaPKY0P9czcQg4rBI-EMi-3v5G9yPfrA/exec';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        document.getElementById('product-name').textContent = 'Invalid Product ID';
        return;
    }

    try {
        const res = await fetch(GOOGLE_SHEET_API_URL);
        const data = await res.json();

        const productVariants = data.filter(item => item.id === productId);
        if (productVariants.length === 0) {
            document.getElementById('product-name').textContent = 'Product not found';
            return;
        }

        const base = productVariants[0];
        document.getElementById('product-name').textContent = base.itemName;

        const container = document.getElementById('product-info');
        productVariants.forEach(variant => {
            const block = document.createElement('div');
            block.classList.add('product-card');
            block.innerHTML = `
                <div class="product-image-container">
                    <img src="${variant.image || 'https://placehold.co/200x200'}" alt="Product Image">
                </div>
                <div class="product-content">
                    <p>${variant.description}</p>
                    <p><strong>Variant 1:</strong> ${variant.variant1 || '-'}</p>
                    <p><strong>Variant 2:</strong> ${variant.variant2 || '-'}</p>
                    <p><strong>Price:</strong> $${parseFloat(variant.discountPrice || variant.unitSale).toFixed(2)}</p>
                    <p><strong>Stock:</strong> ${variant.currentOnHand}</p>
                </div>
            `;
            container.appendChild(block);
        });
    } catch (err) {
        console.error(err);
        document.getElementById('product-name').textContent = 'Error loading product';
    }
});
