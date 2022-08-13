const router = require('express').Router();

var passport = require('passport');

const authRoutes = require('./auth');
const ratingRoutes = require('./ratings');
const movies = require('./movies');
// const addressRoutes = require('./address');
// const newsletterRoutes = require('./newsletter');
// const productRoutes = require('./product');
// const categoryRoutes = require('./category');
// const subcategoryRoutes = require('./subcategory');
// const discountRoutes = require('./discount');
// const brandRoutes = require('./brand');
// const contactRoutes = require('./contact');
// const merchantRoutes = require('./merchant');
// const cartRoutes = require('./cart');
// const orderRoutes = require('./order');
// const reviewRoutes = require('./review');
// const wishlistRoutes = require('./wishlist');
// const payementRoutes = require("./payment");

// auth routes
router.use('/auth', authRoutes);
router.use("/ratings", ratingRoutes);
router.use("/movie", movies);

// // user routes
// router.use('/user', userRoutes);

// // address routes
// router.use('/address', addressRoutes);

// // newsletter routes
// router.use('/newsletter', newsletterRoutes);

// // product routes
// router.use('/product', productRoutes);

// // category routes
// router.use('/category', categoryRoutes);

// // subcategory routes
// router.use('/subcategory', subcategoryRoutes);

// // discount routes
// router.use('/discount', discountRoutes);

// // brand routes
// router.use('/brand', brandRoutes);

// // contact routes
// router.use('/contact', contactRoutes);

// // merchant routes
// router.use('/merchant', merchantRoutes);

// // cart routes
// router.use('/cart', cartRoutes);

// // order routes
// router.use('/order', orderRoutes);

// // payment routes
// router.use("/payment", payementRoutes);

// // Review routes
// router.use('/review', reviewRoutes);

// // Wishlist routes
// router.use('/wishlist', wishlistRoutes);

module.exports = router;
