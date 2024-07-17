const express = require('express');
const router = express.Router();
const {getProducts, updateProductList} = require('../controller/productController');
const multer = require('multer');


const upload = multer({ storage: multer.memoryStorage() });


router.route('/').get(getProducts);
router.route('/update-product-list').post(upload.single('File'), updateProductList);

module.exports = router;