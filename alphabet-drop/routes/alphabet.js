const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alphabetController');

router.get('/search', ctrl.search);
router.post('/vote', ctrl.vote);
router.get('/leaderboard', ctrl.leaderboard);
router.get('/card-types', ctrl.cardTypes);
router.get('/stats', ctrl.stats);

module.exports = router;
