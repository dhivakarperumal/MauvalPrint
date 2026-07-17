const express = require('express');
const router = express.Router();
const logoController = require('../controllers/logoController');

router.get('/', logoController.getLogos);
router.post('/', logoController.addLogo);
router.put('/:id', logoController.updateLogo);
router.delete('/:id', logoController.deleteLogo);

module.exports = router;
