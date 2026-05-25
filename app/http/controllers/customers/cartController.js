const { json } = require("express")

function cartController() {
    return {
        index(req, res) {
            res.render('customers/cart')
        },
        update(req, res) {
            // let cart = {
            //     items: {
            //         pizzaId: { item: pizzaObject, qty:0 },
            //         pizzaId: { item: pizzaObject, qty:0 },
            //         pizzaId: { item: pizzaObject, qty:0 },
            //     },
            //     totalQty: 0,
            //     totalPrice: 0
            // }
            // for the first time creating cart and adding basic object structure
            if (!req.session.cart) {
                req.session.cart = {
                    items: {},
                    totalQty: 0,
                    totalPrice: 0
                }
            }
            let cart = req.session.cart

            // Check if item does not exist in cart 
            if(!cart.items[req.body._id]) {
                cart.items[req.body._id] = {
                    item: req.body,
                    qty: 1
                }
                cart.totalQty = cart.totalQty + 1
                cart.totalPrice = cart.totalPrice + req.body.price
            } else {
                cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1
                cart.totalQty = cart.totalQty + 1
                cart.totalPrice =  cart.totalPrice + req.body.price
            }
            // Return total quantity and this item's quantity so client can update per-item UI
            return res.json({ totalQty: req.session.cart.totalQty, itemQty: cart.items[req.body._id].qty })
        }
        ,
        change(req, res) {
            // expects {_id, change: +1 or -1 }
            if (!req.session.cart) {
                return res.status(400).json({ message: 'Cart is empty' })
            }
            let cart = req.session.cart
            const id = req.body._id
            const change = parseInt(req.body.change)
            if (!cart.items[id]) {
                return res.status(404).json({ message: 'Item not in cart' })
            }
            // apply change
            cart.items[id].qty = cart.items[id].qty + change
            cart.totalQty = cart.totalQty + change
            cart.totalPrice = cart.totalPrice + (cart.items[id].item.price * change)
            // remove if qty <= 0
            if (cart.items[id].qty <= 0) {
                cart.totalQty = cart.totalQty - cart.items[id].qty // adjust (if it went negative)
                delete cart.items[id]
            }
            // ensure non-negative totals
            if (cart.totalQty < 0) cart.totalQty = 0
            if (cart.totalPrice < 0) cart.totalPrice = 0

            req.session.cart = cart
            const itemQty = cart.items[id] ? cart.items[id].qty : 0
            const itemTotalPrice = cart.items[id] ? cart.items[id].qty * cart.items[id].item.price : 0
            return res.json({ totalQty: cart.totalQty, itemQty, itemTotalPrice, totalPrice: cart.totalPrice })
        }
        ,
        applyDiscount(req, res) {
            // expects { code }
            if (!req.session.cart) {
                return res.redirect('/cart')
            }
            const code = (req.body.code || '').toString().trim().toUpperCase()
            // simple promo map - percentage discounts
            const promos = {
                'PIZZA10': 10,
                'WELCOME20': 20,
                'FESTIVE30': 30
            }
            const pct = promos[code]
            // recompute base total from items to avoid stacking discounts
            let baseTotal = 0
            Object.values(req.session.cart.items || {}).forEach(i => {
                baseTotal += (i.item.price * i.qty)
            })
            if (!pct) {
                // invalid code - remove any existing discount and redirect with flash
                req.session.cart.discount = null
                req.session.cart.totalPrice = baseTotal
                req.flash('error', 'Invalid promo code')
                return res.redirect('/cart')
            }
            const discountAmount = Math.round(baseTotal * (pct/100))
            req.session.cart.discount = { code, pct, amount: discountAmount }
            req.session.cart.totalPrice = baseTotal - discountAmount
            req.flash('success', `Promo ${code} applied: ${pct}% off`)
            return res.redirect('/cart')
        }
    }
}

module.exports = cartController