const express = require('express');
const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders
} = require('../controllers/orders');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('admin'), getOrders)
  .post(protect, addOrderItems);

router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);

module.exports = router;
