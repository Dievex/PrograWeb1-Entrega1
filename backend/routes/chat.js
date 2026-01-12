const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/mensajes', chatController.list);

router.post('/mensajes', chatController.create);

module.exports = router;
   
