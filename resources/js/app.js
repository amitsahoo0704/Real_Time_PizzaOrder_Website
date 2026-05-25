 import axios from 'axios'
 import Noty from 'noty'
 import { initAdmin } from './admin'
 import moment from 'moment'

let addToCart = document.querySelectorAll('.add-to-cart')
let cartCounter = document.querySelector('#cartCounter')

function updateCart(pizza, btn) {
    axios.post('/update-cart', pizza).then(res => {
        cartCounter.innerText = res.data.totalQty

        // Update per-item count on the button
        if (btn && typeof res.data.itemQty !== 'undefined') {
            let countSpan = btn.querySelector('.add-count')
            if (!countSpan) {
                countSpan = document.createElement('span')
                countSpan.className = 'add-count ml-2 bg-green-500 text-white rounded-full px-3 py-1 text-sm'
                btn.appendChild(countSpan)
            }
            countSpan.innerText = `+${res.data.itemQty}`
        }

        new Noty({
            type: 'success',
            timeout: 1000,
            text: 'Item added to cart',
            progressBar: false,
        }).show();
    }).catch(err => {
        new Noty({
            type: 'error',
            timeout: 1000,
            text: 'Something went wrong',
            progressBar: false,
        }).show();
    })
}

addToCart.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        let pizza = JSON.parse(btn.dataset.pizza)
        updateCart(pizza, btn)
    })
})

// Quantity controls in cart page
function changeQuantity(id, change, callerBtn) {
    axios.post('/cart/change', { _id: id, change: change }).then(res => {
        cartCounter.innerText = res.data.totalQty
        // Update item qty and totals on the cart page if present
        const row = document.querySelector(`.cart-item[data-id="${id}"]`)
        if (row) {
            const qtySpan = row.querySelector('.item-qty')
            const totalSpan = row.querySelector('.item-total')
            qtySpan.innerText = res.data.itemQty
            totalSpan.innerText = '₹ ' + res.data.itemTotalPrice
        }
        // Update overall total amount element if present
        const totalAmount = document.querySelector('.amount')
        if (totalAmount) totalAmount.innerText = '₹' + res.data.totalPrice
    }).catch(err => {
        new Noty({ type: 'error', timeout: 1000, text: 'Could not update quantity', progressBar: false }).show();
    })
}

// Delegate events for qty buttons
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('qty-increase')) {
        const row = e.target.closest('.cart-item')
        const id = row && row.dataset.id
        if (id) changeQuantity(id, 1, e.target)
    } else if (e.target && e.target.classList.contains('qty-decrease')) {
        const row = e.target.closest('.cart-item')
        const id = row && row.dataset.id
        if (id) changeQuantity(id, -1, e.target)
    }
})

// Remove alert message after X seconds
const alertMsg = document.querySelector('#success-alert')
if(alertMsg) {
    setTimeout(() => {
        alertMsg.remove()
    }, 2000)
}



// Change order status
let statuses = document.querySelectorAll('.status_line')
let hiddenInput = document.querySelector('#hiddenInput')
let order = hiddenInput ? hiddenInput.value : null
order = JSON.parse(order)
let time = document.createElement('small')

function updateStatus(order) {
    statuses.forEach((status) => {
        status.classList.remove('step-completed')
        status.classList.remove('current')
    })
    let stepCompleted = true;
    statuses.forEach((status) => {
       let dataProp = status.dataset.status
       if(stepCompleted) {
            status.classList.add('step-completed')
       }
       if(dataProp === order.status) {
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('hh:mm A')
            status.appendChild(time)
           if(status.nextElementSibling) {
            status.nextElementSibling.classList.add('current')
           }
       }
    })

}

updateStatus(order);

// Stripe removed for COD-only flow. (initStripe() disabled)

// Socket
let socket = io()

// Join
if(order) {
    socket.emit('join', `order_${order._id}`)
}
let adminAreaPath = window.location.pathname
if(adminAreaPath.includes('admin')) {
    initAdmin(socket)
    socket.emit('join', 'adminRoom')
}


socket.on('orderUpdated', (data) => {
    const updatedOrder = { ...order }
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status
    updateStatus(updatedOrder)
    new Noty({
        type: 'success',
        timeout: 1000,
        text: 'Order updated',
        progressBar: false,
    }).show();
})

