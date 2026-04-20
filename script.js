// Contact form OTP logic
document.getElementById('send-otp-btn').addEventListener('click', async function() {
    const email = document.getElementById('contact-email').value;
    if (!email) {
        alert('Please enter your email first.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            alert('OTP sent to your email!');
            // Show OTP input and message fields
            document.getElementById('otp-input').style.display = 'block';
            document.getElementById('contact-message').style.display = 'block';
            document.getElementById('send-message-btn').style.display = 'block';
            this.style.display = 'none'; // Hide send OTP button
        } else {
            alert('Failed to send OTP: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error sending OTP. Please try again.');
    }
});

document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const otp = document.getElementById('otp-input').value;
    const message = document.getElementById('contact-message').value;

    if (!otp) {
        alert('Please enter the OTP.');
        return;
    }

    try {
        // First, verify OTP
        const verifyResponse = await fetch('http://localhost:3000/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp })
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            alert('Invalid or expired OTP: ' + verifyData.error);
            return;
        }

        // OTP verified, now send message
        const messageResponse = await fetch('http://localhost:3000/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, message })
        });

        const messageData = await messageResponse.json();

        if (messageData.success) {
            alert('Message sent successfully!');
            // Reset form
            this.reset();
            document.getElementById('otp-input').style.display = 'none';
            document.getElementById('contact-message').style.display = 'none';
            document.getElementById('send-message-btn').style.display = 'none';
            document.getElementById('send-otp-btn').style.display = 'block';
        } else {
            alert('Failed to send message: ' + messageData.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing request. Please try again.');
    }
});

// Simple mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Smooth scrolling for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        // Close mobile menu if open
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Cart functionality with localStorage
let cart = [];

function loadCart() {
    const saved = localStorage.getItem('realcoffee_cart');
    if (saved) {
        cart = JSON.parse(saved);
    }
    updateCartDisplay();
    saveCart();
}

function saveCart() {
    localStorage.setItem('realcoffee_cart', JSON.stringify(cart));
}

// Load cart on page load
loadCart();

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="item-info">
                <strong>${item.name}</strong> - Quantity: ${item.quantity}
            </div>
            <div class="item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
        `;
            cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;
    saveCart();
}

function addToCart(name, price, quantity) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ name, price, quantity });
    }
    updateCartDisplay();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
    saveCart();
}

// Add event listeners to add-to-cart buttons
document.querySelectorAll('.add-to-cart').forEach((button, index) => {
    button.addEventListener('click', () => {
        const menuItem = button.parentElement;
        const name = menuItem.querySelector('h3').textContent;
        const priceText = menuItem.querySelector('.price').textContent;
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        const quantity = parseInt(menuItem.querySelector('.quantity').value, 10);
        addToCart(name, price, quantity);
    });
});

function sendOwnerMessage(phone) {
    const message = `Thank you for your visit! Please visit again.`;
    const orderStatus = document.getElementById('order-status');
    orderStatus.innerHTML = `Message sent to customer <strong>${phone}</strong>: ${message}`;
    orderStatus.classList.add('visible');
    console.log(`Thank you message sent to ${phone}: ${message}`);
    clearTimeout(sendOwnerMessage.hideTimeout);
    sendOwnerMessage.hideTimeout = setTimeout(() => {
        orderStatus.classList.remove('visible');
    }, 8000);
}

// Form handlers
document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (cart.length === 0) {
        alert('Your cart is empty! Please add items first.');
        return;
    }
    const formData = new FormData(e.target);
    const name = formData.get('name') || e.target.querySelector('input[placeholder="Full Name"]').value;
    const phone = formData.get('phone') || e.target.querySelector('input[placeholder="Phone Number"]').value;
    const address = formData.get('address') || e.target.querySelector('input[placeholder="Delivery Address"]').value;
    const notes = e.target.querySelector('textarea').value;
    const total = document.getElementById('cart-total').textContent;
    document.getElementById('order-total').value = total;
    document.getElementById('cart-data').value = JSON.stringify(cart);
    sendOwnerMessage(phone);
    alert(`Order placed successfully!\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nNotes: ${notes}\n${total}\nDelivery in 30 mins. Pay on delivery.`);
    cart = [];
    updateCartDisplay();
    e.target.reset();
});