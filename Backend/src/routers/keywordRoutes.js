const express = require('express');
const router = express.Router();
const { getKeywords, createKeyword, updateKeyword, deleteKeyword, getKeywordStats, bulkAssignKeywords } = require('../controllers/keywordController');

router.get('/', getKeywords);
router.post('/', createKeyword);
router.put('/:id', updateKeyword);
router.delete('/:id', deleteKeyword);
router.get('/stats', getKeywordStats);
router.post('/bulk-assign', bulkAssignKeywords);

module.exports = router;
