const express = require('express');
const router = express.Router();
const { getKeywords, createKeyword, updateKeyword, deleteKeyword, getKeywordStats, bulkAssignKeywords, getHomeKeywords } = require('../controllers/keywordController');

router.get('/', getKeywords);
router.get('/home', getHomeKeywords);
router.post('/', createKeyword);
router.put('/:id', updateKeyword);
router.delete('/:id', deleteKeyword);
router.get('/stats', getKeywordStats);
router.post('/bulk-assign', bulkAssignKeywords);

module.exports = router;
