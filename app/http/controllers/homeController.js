const Menu = require('../../models/menu')
function homeController() {
    return {
        async index(req, res) {
            try {
                const pizzas = await Menu.find()
                return res.render('home', { pizzas: pizzas })
            } catch (err) {
                console.error('Error fetching pizzas:', err.message || err)
                // Render home with empty pizzas and an error message
                return res.render('home', { pizzas: [], dbError: true })
            }
        }
    }
}

module.exports = homeController