const express = require('express');
const router = express.Router();
const {getProducts, updateProductList} = require('../controller/productController');
const { updatePackages } = require('../controller/packageController');
const multer = require('multer');


const upload = multer({ storage: multer.memoryStorage() });


router.route('/').get(getProducts);
router.route('/update-product-list').post(upload.single('File'), updateProductList);
router.route('/update-packages').post( updatePackages);

module.exports = router;