const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

// 컨트롤러 import
const dashboardController = require('../controllers/dashboardController');
const movieController = require('../controllers/movieController');
const userController = require('../controllers/userController');
const curatorController = require('../controllers/curatorController');
const orderController = require('../controllers/orderController');
const supportController = require('../controllers/supportController');
const uploadController = require('../controllers/uploadController');

// 모든 라우트에 인증 & 관리자 권한 적용
router.use(protect);
router.use(admin);

// ===================
// Dashboard Routes
// ===================
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/revenue-chart', dashboardController.getRevenueChart);
router.get('/dashboard/recent-orders', dashboardController.getRecentOrders);
router.get('/dashboard/top-movies', dashboardController.getTopMovies);

// ===================
// Movie Routes
// ===================
router.route('/movies')
  .get(movieController.getMovies)
  .post(movieController.createMovie);

router.route('/movies/:id')
  .get(movieController.getMovie)
  .put(movieController.updateMovie)
  .delete(movieController.deleteMovie);

router.put('/movies/:id/featured', movieController.toggleFeatured);
router.put('/movies/:id/products', movieController.linkProducts);
router.post('/movies/autofill', movieController.autofillFromIMDb);
router.put('/movies/:id/views', movieController.incrementViews);

// ===================
// User Routes
// ===================
router.route('/users')
  .get(userController.getUsers)
  .post(userController.createUser);

router.route('/users/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.put('/users/:id/toggle-active', userController.toggleActive);
router.put('/users/:id/extend-membership', userController.extendMembership);
router.post('/users/:id/promote-curator', userController.promoteToCurator);
router.get('/users/:id/watch-history', userController.getWatchHistory);
router.get('/users/:id/stats', userController.getUserStats);

// ===================
// Curator Routes
// ===================
router.route('/curators')
  .get(curatorController.getCurators);

router.route('/curators/:id')
  .get(curatorController.getCurator)
  .put(curatorController.updateCurator)
  .delete(curatorController.demoteCurator);

router.put('/curators/:id/featured', curatorController.toggleFeatured);
router.put('/curators/:id/toggle-active', curatorController.toggleActive);

// Curator Collections
router.post('/curators/:id/collections', curatorController.createCollection);
router.put('/curators/:curatorId/collections/:collectionId', curatorController.updateCollection);
router.delete('/curators/:curatorId/collections/:collectionId', curatorController.deleteCollection);

// ===================
// Order Routes
// ===================
router.get('/orders/stats', orderController.getOrderStats);

router.route('/orders')
  .get(orderController.getOrders);

router.route('/orders/:id')
  .get(orderController.getOrder)
  .delete(orderController.deleteOrder);

router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/payment-status', orderController.updatePaymentStatus);
router.put('/orders/:id/cancel', orderController.cancelOrder);
router.put('/orders/:id/shipping', orderController.updateShipping);

// ===================
// Support Routes
// ===================
router.get('/support/stats', supportController.getStats);

router.route('/support')
  .get(supportController.getTickets);

router.route('/support/:id')
  .get(supportController.getTicket)
  .delete(supportController.deleteTicket);

router.put('/support/:id/status', supportController.updateStatus);
router.put('/support/:id/priority', supportController.updatePriority);
router.put('/support/:id/assign', supportController.assignTicket);
router.post('/support/:id/responses', supportController.addResponse);
router.put('/support/:id/spoiler-action', supportController.handleSpoilerReport);

// ===================
// Upload Routes
// ===================
router.post('/upload', uploadController.uploadSingle);
router.post('/upload/multiple', uploadController.uploadMultiple);
router.post('/upload/chunk', uploadController.uploadChunk);
router.delete('/upload/:filename', uploadController.deleteFile);
router.get('/upload/list', uploadController.listFiles);

module.exports = router;
