const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Banner
 *   description: Quản lý banner thông báo
 */

/**
 * @swagger
 * /api/banners/active:
 *   get:
 *     summary: Lấy banner đang hoạt động (public)
 *     tags: [Banner]
 *     responses:
 *       200:
 *         description: Danh sách banner active
 */
router.get('/active', bannerController.getActiveBanners);

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Lấy tất cả banner (admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả banner
 */
router.get('/', authenticate, adminOnly, bannerController.getAllBanners);

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Tạo banner mới (admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [sale, hot, new, info]
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               discount:
 *                 type: number
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Banner đã được tạo
 */
router.post('/', authenticate, adminOnly, bannerController.createBanner);

/**
 * @swagger
 * /api/banners/{id}:
 *   put:
 *     summary: Cập nhật banner (admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner đã được cập nhật
 */
router.put('/:id', authenticate, adminOnly, bannerController.updateBanner);

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Xóa banner (admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner đã được xóa
 */
router.delete('/:id', authenticate, adminOnly, bannerController.deleteBanner);

/**
 * @swagger
 * /api/banners/{id}/toggle:
 *   patch:
 *     summary: Bật/tắt banner (admin)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trạng thái banner đã được thay đổi
 */
router.patch('/:id/toggle', authenticate, adminOnly, bannerController.toggleBannerStatus);

module.exports = router;
