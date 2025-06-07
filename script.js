// REPLACE THIS WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL
const GOOGLE_SHEET_API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

async function fetchProducts() {
    const productsContainer = document.getElementById('products-container');
    productsContainer.innerHTML = '<h2>Our Products</h2><p>Loading products...</p>';

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL);
        const data = await response.json();

        if (data.error) {
            productsContainer.innerHTML = `<h2>Error: ${data.error}</h2><p>Please check your Google Apps Script deployment and sheet name.</p>`;
            console.error("API Error:", data.error);
            return;
        }

        console.log("Fetched Data:", data); // For debugging

        // Group variants
        const groupedProducts = groupVariants(data);
        console.log("Grouped Products:", groupedProducts); // For debugging

        productsContainer.innerHTML = '<h2>Our Products</h2>'; // Clear loading message

        if (Object.keys(groupedProducts).length === 0) {
            productsContainer.innerHTML += '<p>No products found.</p>';
            return;
        }

        for (const productName in groupedProducts) {
            const product = groupedProducts[productName];
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            // Image (optional, if you want to use the 'Image' column)
            // If you have image URLs in your sheet, you can display them
            // const img = document.createElement('img');
            // img.src = product.variants[0].image || 'placeholder.png'; // Use first variant's image or a placeholder
            // img.alt = product.itemName;
            // img.classList.add('product-image');
            // productCard.appendChild(img);

            const productDetails = document.createElement('div');
            productDetails.classList.add('product-details');
            productDetails.innerHTML = `
                <h3>${product.itemName}</h3>
                <p>${product.description}</p>
                <p>Unit Sale: $${parseFloat(product.variants[0].unitSale).toFixed(2)}</p>
            `;
            productCard.appendChild(productDetails);

            const productVariants = document.createElement('div');
            productVariants.classList.add('product-variants');

            // Create a dropdown for Variant 1 (e.g., Color) if applicable
            let variant1Select = null;
            if (product.variants[0].variant1) { // Check if variant1 exists for the first item
                variant1Select = document.createElement('select');
                variant1Select.classList.add('variant-select', 'variant1-select');
                product.availableVariant1Options.forEach(v1 => {
                    const option = document.createElement('option');
                    option.value = v1;
                    option.textContent = v1;
                    variant1Select.appendChild(option);
                });
                productVariants.appendChild(document.createElement('label')).textContent = 'Variant 1: ';
                productVariants.appendChild(variant1Select);
            }

            // Create a dropdown for Variant 2 (e.g., Size) if applicable
            let variant2Select = null;
            if (product.variants[0].variant2) { // Check if variant2 exists for the first item
                variant2Select = document.createElement('select');
                variant2Select.classList.add('variant-select', 'variant2-select');
                // Options will be populated based on variant1 selection
                productVariants.appendChild(document.createElement('label')).textContent = 'Variant 2: ';
                productVariants.appendChild(variant2Select);
            }

            // Function to update Variant 2 options and display stock
            const updateVariantOptionsAndStock = () => {
                const selectedVariant1 = variant1Select ? variant1Select.value : null;
                const availableVariantsForSelection = selectedVariant1
                    ? product.variants.filter(v => v.variant1 === selectedVariant1)
                    : product.variants;

                if (variant2Select) {
                    variant2Select.innerHTML = ''; // Clear previous options
                    // Sort options for consistent display
                    availableVariantsForSelection.sort((a,b) => (a.variant2 > b.variant2) ? 1 : ((b.variant2 > a.variant2) ? -1 : 0));
                    availableVariantsForSelection.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v.variant2;
                        option.textContent = v.variant2;
                        variant2Select.appendChild(option);
                    });
                }
                displayCurrentStock(productCard, product, selectedVariant1, variant2Select ? variant2Select.value : null);
            };

            // Event listeners for variant selection to update available stock
            if (variant1Select) {
                variant1Select.addEventListener('change', updateVariantOptionsAndStock);
            }
            if (variant2Select) {
                variant2Select.addEventListener('change', () => displayCurrentStock(productCard, product, variant1Select ? variant1Select.value : null, variant2Select.value));
            }

            // Initial call to populate variants and display stock
            updateVariantOptionsAndStock();


            const stockDisplay = document.createElement('p');
            stockDisplay.classList.add('stock-info');
            productVariants.appendChild(stockDisplay);

            const addButton = document.createElement('button');
            addButton.classList.add('add-to-cart-btn');
            addButton.textContent = 'Add to Cart';
            addButton.disabled = true; // Disable until a valid variant is selected and in stock
            productVariants.appendChild(addButton);

            // Add to cart functionality (will be fleshed out in Phase 2)
            addButton.addEventListener('click', () => {
                const selectedVariant1 = variant1Select ? variant1Select.value : null;
                const selectedVariant2 = variant2Select ? variant2Select.value : null;

                const selectedItem = product.variants.find(v =>
                    (v.variant1 === selectedVariant1 || !v.variant1) &&
                    (v.variant2 === selectedVariant2 || !v.variant2)
                );

                if (selectedItem && selectedItem.currentOnHand > 0) {
                    // Placeholder for adding to cart
                    console.log(`Added ${selectedItem.itemName} (${selectedItem.variant1 || ''} ${selectedItem.variant2 || ''}) to cart!`);
                    // Here you would call a function to add to the actual cart and update UI
                    alert(`Added "${selectedItem.itemName} - ${selectedItem.variant1 || ''} ${selectedItem.variant2 || ''}" to cart!`);
                } else {
                    alert('Item is out of stock or invalid selection.');
                }
            });

            productCard.appendChild(productVariants);
            productsContainer.appendChild(productCard);

            // Initial stock display for the default selected variant
            displayCurrentStock(productCard, product, variant1Select ? variant1Select.value : null, variant2Select ? variant2Select.value : null);

        }

    } catch (error) {
        productsContainer.innerHTML = '<h2>Error loading products.</h2><p>Please check your internet connection or the API URL.</p>';
        console.error("Failed to fetch products:", error);
    }
}

/**
 * Groups product variants from a flat array into a structured object.
 * @param {Array} data - The array of product objects from the Google Sheet.
 * @returns {Object} An object where keys are product names and values are product objects with variants.
 */
function groupVariants(data) {
    const grouped = {};

    data.forEach(item => {
        const itemName = item.itemName;
        if (!itemName) return; // Skip rows without an item name

        if (!grouped[itemName]) {
            grouped[itemName] = {
                itemName: itemName,
                description: item.description,
                variants: [],
                availableVariant1Options: new Set(), // To store unique variant1 options
            };
        }
        grouped[itemName].variants.push(item);

        if (item.variant1) {
            grouped[itemName].availableVariant1Options.add(item.variant1);
        }
    });

    // Convert sets to arrays and sort them
    for (const key in grouped) {
        if (grouped[key].availableVariant1Options) {
            grouped[key].availableVariant1Options = Array.from(grouped[key].availableVariant1Options).sort();
        }
    }

    return grouped;
}

/**
 * Updates the displayed stock information for a product based on selected variants.
 * Also enables/disables the add to cart button.
 * @param {HTMLElement} productCard - The DOM element for the product card.
 * @param {Object} product - The grouped product object.
 * @param {string|null} selectedVariant1 - The currently selected value for variant1.
 * @param {string|null} selectedVariant2 - The currently selected value for variant2.
 */
function displayCurrentStock(productCard, product, selectedVariant1, selectedVariant2) {
    const stockDisplayElement = productCard.querySelector('.stock-info');
    const addButton = productCard.querySelector('.add-to-cart-btn');

    let matchingVariant = null;

    if (selectedVariant1 && selectedVariant2) {
        matchingVariant = product.variants.find(v =>
            v.variant1 === selectedVariant1 && v.variant2 === selectedVariant2
        );
    } else if (selectedVariant1) {
        // If only variant1 is selected, find the first variant matching v1
        matchingVariant = product.variants.find(v => v.variant1 === selectedVariant1);
    } else if (product.variants.length > 0 && !product.variants[0].variant1 && !product.variants[0].variant2) {
        // Handle products with no variants, just take the first (and only) item
        matchingVariant = product.variants[0];
    } else if (product.variants.length === 1 && !product.variants[0].variant1 && product.variants[0].variant2) {
        // Special case for only variant2 existing (less common but possible)
        matchingVariant = product.variants.find(v => v.variant2 === selectedVariant2);
    } else {
        // Fallback for cases with no variants, or if a selection hasn't been made yet
        matchingVariant = product.variants[0]; // Take the first one as a default display
    }


    if (matchingVariant) {
        const stock = parseInt(matchingVariant.currentOnHand, 10);
        if (stock > 0) {
            stockDisplayElement.textContent = `In Stock: ${stock}`;
            stockDisplayElement.classList.remove('out-of-stock');
            addButton.disabled = false;
        } else {
            stockDisplayElement.textContent = `Out of Stock`;
            stockDisplayElement.classList.add('out-of-stock');
            addButton.disabled = true;
        }
    } else {
        stockDisplayElement.textContent = `No stock info available.`;
        stockDisplayElement.classList.add('out-of-stock');
        addButton.disabled = true;
    }
}

// --- Shopping Cart functionality will go here in Phase 2 ---
let cart = []; // Array to hold cart items

function saveCart() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

function loadCart() {
    const storedCart = localStorage.getItem('shoppingCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    renderCart();
}

function renderCart() {
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    cartItemsElement.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsElement.innerHTML = '<li>Your cart is empty.</li>';
    } else {
        cart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${item.itemName}
                ${item.variant1 ? ` (${item.variant1})` : ''}
                ${item.variant2 ? ` (${item.variant2})` : ''}
                x ${item.quantity} - $${(item.unitSale * item.quantity).toFixed(2)}
                <button onclick="removeFromCart('${item.uniqueId}')">Remove</button>
            `;
            cartItemsElement.appendChild(li);
            total += item.unitSale * item.quantity;
        });
    }
    cartTotalElement.textContent = total.toFixed(2);
}

function addToCart(selectedItem) {
    // Generate a unique ID for the item in the cart to handle multiple variants of the same product
    const uniqueId = `${selectedItem.id}-${selectedItem.variant1 || 'noV1'}-${selectedItem.variant2 || 'noV2'}`;

    const existingItem = cart.find(item => item.uniqueId === uniqueId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            uniqueId: uniqueId,
            id: selectedItem.id,
            itemName: selectedItem.itemName,
            description: selectedItem.description,
            variant1: selectedItem.variant1,
            variant2: selectedItem.variant2,
            unitSale: parseFloat(selectedItem.unitSale),
            quantity: 1
        });
    }
    saveCart();
    renderCart();
}

function removeFromCart(uniqueId) {
    cart = cart.filter(item => item.uniqueId !== uniqueId);
    saveCart();
    renderCart();
}

// Initial cart load
loadCart();

// Update the add to cart button event listener in fetchProducts function to use the new addToCart
// For each product card:
// addButton.addEventListener('click', () => {
//     const selectedVariant1 = variant1Select ? variant1Select.value : null;
//     const selectedVariant2 = variant2Select ? variant2Select.value : null;

//     const selectedItem = product.variants.find(v =>
//         (v.variant1 === selectedVariant1 || !v.variant1) &&
//         (v.variant2 === selectedVariant2 || !v.variant2)
//     );

//     if (selectedItem && selectedItem.currentOnHand > 0) {
//         addToCart(selectedItem); // Use the new function
//         alert(`Added "${selectedItem.itemName} - ${selectedItem.variant1 || ''} ${selectedItem.variant2 || ''}" to cart!`);
//     } else {
//         alert('Item is out of stock or invalid selection.');
//     }
// });