const express = require('express');
const router = express.Router();

// Mount sub-routers for catalog modules
router.use('/clientes', require('./clientes'));
router.use('/modelos', require('./modelos'));
router.use('/series', require('./series'));

module.exports = router;
