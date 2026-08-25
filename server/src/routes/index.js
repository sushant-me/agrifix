import { Router } from 'express';
import { optionalAuth, requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { uploadProductImage, uploadProductImages, uploadAvatar, uploadDataset, uploadLeaf, uploadApplicationDocs } from '../middleware/upload.js';

import * as auth from '../controllers/auth.controller.js';
import * as farmer from '../controllers/farmer.controller.js';
import * as marketplace from '../controllers/marketplace.controller.js';
import * as cart from '../controllers/cart.controller.js';
import * as orders from '../controllers/order.controller.js';
import * as payments from '../controllers/payment.controller.js';
import * as ml from '../controllers/ml.controller.js';
import * as weather from '../controllers/weather.controller.js';
import * as support from '../controllers/support.controller.js';
import * as admin from '../controllers/admin.controller.js';
import * as user from '../controllers/user.controller.js';

const router = Router();

/* ------------------------------------------------------------------- auth */
router.post('/auth/signup', uploadAvatar.single('avatar'), auth.signup);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', optionalAuth, auth.me);
router.post('/auth/change-password', optionalAuth, requireAuth, auth.changePassword);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/verify-otp', auth.verifyOtp);
router.post('/auth/reset-password', auth.resetPassword);
router.post('/users/avatar', optionalAuth, requireAuth, uploadAvatar.single('avatar'), auth.updateAvatar);

/* ------------------------------------------------------------ marketplace */
router.get('/products', optionalAuth, marketplace.listProducts);
router.get('/products/:id', optionalAuth, marketplace.getProduct);
router.post('/products/:id/reviews', optionalAuth, requireAuth, marketplace.saveReview);
router.delete('/products/:id/reviews', optionalAuth, requireAuth, marketplace.deleteReview);
router.post('/products', optionalAuth, requireAdmin, uploadProductImages.array('productImages', 4), marketplace.addProduct);
router.patch('/products/:id', optionalAuth, requireAdmin, uploadProductImages.array('productImages', 4), marketplace.updateProduct);
router.delete('/products/:id/images/:imageId', optionalAuth, requireAuth, marketplace.deleteProductImage);

/* ---------------------------------------------------------------- wishlist */
router.get('/wishlist', optionalAuth, requireAuth, marketplace.listWishlist);
router.post('/wishlist', optionalAuth, requireAuth, marketplace.addWishlist);
router.delete('/wishlist/:productId', optionalAuth, requireAuth, marketplace.removeWishlist);

/* ------------------------------------------------------------------- cart */
router.get('/cart', optionalAuth, requireAuth, cart.getCart);
router.post('/cart/items', optionalAuth, requireAuth, cart.addToCart);
router.patch('/cart/items/:id', optionalAuth, requireAuth, cart.updateCartItem);
router.delete('/cart/items/:id', optionalAuth, requireAuth, cart.removeCartItem);

/* --------------------------------------------------------- user profile */
router.get('/user/profile', optionalAuth, requireAuth, user.myProfile);
router.patch('/user/profile', optionalAuth, requireAuth, user.updateProfile);
router.get('/users/:id/public', optionalAuth, user.publicProfile);
router.get('/users/:id/status', optionalAuth, user.userStatus);
router.get('/users/:id/summary', optionalAuth, user.userSummaryMini);
router.post('/chat/heartbeat', optionalAuth, requireAuth, user.heartbeat);
router.get('/conversations', optionalAuth, requireAuth, user.listConversations);
router.post('/conversations', optionalAuth, requireAuth, user.getOrCreateConversation);
router.get('/conversations/:id/messages', optionalAuth, requireAuth, user.listMessages);
router.post('/conversations/:id/messages', optionalAuth, requireAuth, user.sendMessage);
router.post('/conversations/:id/read', optionalAuth, requireAuth, user.markConversationRead);
router.post('/orders/:id/refund', optionalAuth, requireAuth, user.requestRefund);
router.get('/user/refunds', optionalAuth, requireAuth, user.listRefunds);
router.get('/admin/refunds', optionalAuth, requireAdmin, user.adminListRefunds);
router.patch('/admin/refunds/:id', optionalAuth, requireAdmin, user.resolveRefund);

/* ----------------------------------------------------------------- orders */
router.post('/orders', optionalAuth, requireAuth, orders.placeOrder);
router.get('/orders', optionalAuth, requireAuth, orders.myOrders);
router.get('/orders/:id', optionalAuth, requireAuth, orders.orderDetails);
router.get('/orders/:id/tracking', optionalAuth, requireAuth, orders.trackOrder);

/* ---------------------------------------------------------------- payments */
router.get('/payments/khalti/init', optionalAuth, requireAuth, payments.khaltiInit);
router.get('/payments/khalti/callback', payments.khaltiCallback);

/* -------------------------------------------------------------- ml predict */
router.post('/ml/crop-recommendation', ml.cropRecommendation);
router.post('/ml/crop-prediction', ml.cropPrediction);
router.post('/ml/fertilizer-recommendation', ml.fertilizerRecommendation);
router.post('/ml/yield-prediction', ml.yieldPrediction);
router.post('/ml/rainfall-prediction', ml.rainfallPrediction);
router.post('/ml/plant-disease', uploadLeaf.single('image'), ml.plantDiseasePrediction);

/* --------------------------------------------------------- farmer onboarding */
router.post('/farmer/apply', requireAuth, uploadApplicationDocs.fields([
  { name: 'citizenshipDoc', maxCount: 1 },
  { name: 'kisanDoc', maxCount: 1 },
]), farmer.applyFarmer);
router.get('/user/farmer-application', requireAuth, farmer.myFarmerApplication);
router.get('/admin/farmer-applications', requireSuperAdmin, farmer.listFarmerApplications);
router.get('/admin/farmer-applications/:id', requireSuperAdmin, farmer.getFarmerApplication);
router.patch('/admin/farmer-applications/:id', requireSuperAdmin, farmer.reviewFarmerApplication);

/* ---------------------------------------------------------------- weather */
router.get('/weather/recent', weather.recentWeather);
router.get('/weather/fetch', weather.fetchWeather);

/* ------------------------------------------------- support (public) */
router.get('/qna', support.qnaList);
router.post('/qna', support.qnaAsk);
router.post('/contact', support.contactUs);

/* ------------------------------------------- farmer workspace (seller-scoped) */

router.get('/admin/farmer/summary', requireAdmin, farmer.mySummary);
router.get('/admin/farmer/products', requireAdmin, farmer.myProducts);
router.delete('/admin/farmer/products/:id', requireAdmin, farmer.myProductDelete);
router.get('/admin/farmer/orders', requireAdmin, farmer.mySales);
router.post('/admin/farmer/orders/:id/status', requireAdmin, farmer.myOrderStatus);
router.delete('/admin/farmer/orders/:id', requireAdmin, farmer.deleteOrder);

/* ------------------------------------------------------------------- admin */
router.get('/admin/dashboard/summary', requireAdmin, admin.dashboardSummary);
router.get('/admin/dashboard/recent-activity', requireAdmin, admin.recentActivity);
router.get('/admin/dashboard/notifications', requireAdmin, admin.notifications);
router.post('/admin/dashboard/notifications/read', requireAdmin, admin.markNotificationRead);

router.get('/admin/users', requireSuperAdmin, admin.usersList);
router.post('/admin/users', requireSuperAdmin, admin.createUser);
router.delete('/admin/users/:id', requireSuperAdmin, admin.deleteUser);
router.post('/admin/users/:id/toggle-active', requireSuperAdmin, admin.toggleUserActive);
router.post('/admin/users/:id/set-role', requireSuperAdmin, admin.setUserRole);
router.post('/admin/users/:id/reset-password', requireSuperAdmin, admin.resetUserPassword);

router.get('/admin/products', requireAdmin, admin.adminProductsList);
router.post('/admin/products', requireAdmin, uploadProductImages.array('productImages', 4), admin.adminProductSave);
router.delete('/admin/products/:id', requireAdmin, marketplace.adminDeleteProduct);

router.get('/admin/orders', requireAdmin, admin.adminOrdersList);
router.post('/admin/orders/:id/status', requireAdmin, orders.adminOrderStatus);

router.get('/admin/news', requireAdmin, admin.newsList);
router.post('/admin/news', requireAdmin, admin.newsSave);
router.delete('/admin/news/:id', requireAdmin, admin.newsDelete);

router.get('/admin/contacts', requireAdmin, admin.contactMessagesList);
router.delete('/admin/contacts/:id', requireAdmin, admin.contactMessageDelete);
router.get('/admin/qna', requireAdmin, admin.qnaAdminList);
router.post('/admin/qna/:id/answer', requireAdmin, admin.qnaAnswer);

router.get('/admin/ml/datasets', requireAdmin, admin.datasetsList);
router.post('/admin/ml/datasets', requireAdmin, uploadDataset.single('datasetFile'), admin.datasetUpload);
router.get('/admin/ml/datasets/:id/preview', requireAdmin, admin.datasetPreview);
router.delete('/admin/ml/datasets/:id', requireAdmin, admin.datasetDelete);
router.get('/admin/ml/models', requireAdmin, admin.modelsList);
router.post('/admin/ml/models/train', requireAdmin, admin.trainModel);

router.get('/admin/farm', requireAdmin, admin.farmList);
router.post('/admin/farm', requireAdmin, admin.farmSave);
router.delete('/admin/farm/:module/:id', requireAdmin, admin.farmDelete);

router.get('/admin/export', requireAdmin, admin.exportReport);

export default router;