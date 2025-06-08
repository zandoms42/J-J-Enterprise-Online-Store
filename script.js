const API_URL = 'https://script.google.com/macros/s/AKfycbxqy3TZk6BzoikhbAjmvd5aOMKenHe0AGY_NOTaPKY0P9czcQg4rBI-EMi-3v5G9yPfrA/exec';

fetch(API_URL)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // This 'data' variable now contains the array of products from your Google Sheet
        console.log(data); // You can check the data in your browser's console
        // Now you need to write the code to display this 'data' on your webpage
        // For example, iterate through 'data' and create HTML elements for each product
        displayInventory(data); // Assuming you have a function named displayInventory
    })
    .catch(error => {
        console.error('Error fetching inventory data:', error);
        document.getElementById('inventory-list').innerHTML = '<p>Error loading inventory. Please try again later.</p>';
    });

function displayInventory(products) {
    const inventoryList = document.getElementById('inventory-list'); // Or whatever your container ID is
    inventoryList.innerHTML = ''; // Clear previous content

    if (products && products.length > 0) {
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item'; // Add a class for styling

            // Example of how to display data for each product
            // Adjust these to match the actual JSON keys from your Apps Script
            // (e.g., 'itemName', 'description', 'currentOnHand', 'image', etc.)
            productDiv.innerHTML = `
                <h3>${product.itemName || 'N/A'}</h3>
                <p>Description: ${product.description || 'N/A'}</p>
                ${product.image ? `<img src="${product.image}" alt="${product.itemName}" style="max-width:100px; height:auto;">` : ''}
                <p>Stock: ${product.currentOnHand !== null ? product.currentOnHand : 'N/A'}</p>
                <p>Unit Cost: $${product.unitCost !== null ? product.unitCost.toFixed(2) : '0.00'}</p>
                <p>Unit Sale: $${product.unitSale !== null ? product.unitSale.toFixed(2) : '0.00'}</p>
                <p>Lifetime Sold: ${product.lifetimeQuantitySold !== null ? product.lifetimeQuantitySold : 'N/A'}</p>
                <p>Lifetime Consumed: ${product.lifetimeQuantityConsumed !== null ? product.lifetimeQuantityConsumed : 'N/A'}</p>
                <p>Profit/Loss: $${product.netProfitLoss !== null ? product.netProfitLoss.toFixed(2) : '0.00'}</p>
                <hr>
            `;
            inventoryList.appendChild(productDiv);
        });
    } else {
        inventoryList.innerHTML = '<p>No inventory items found.</p>';
    }
}