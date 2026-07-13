const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAutomation,
  getAutomations,
  updateAutomation,
  deleteAutomation,
} = require('../controllers/automationController');

router.use(protect); // All automation routes require authentication

router.route('/')
  .post(createAutomation)
  .get(getAutomations);

router.route('/:id')
  .put(updateAutomation)
  .delete(deleteAutomation);

module.exports = router;
