// src/routes/recon.js
// Recon tools endpoints: DNS, Website, Subdomain Finder, Port Scanner, URL Fuzzer

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getReconMenu,
  getDnsLookup,
  getWebsiteRecon,
  getUrlFuzzer,
  getSubdomainFinder,
  getPortScanner,
} = require('../controllers/reconController');

const router = express.Router();

// Public endpoint - get recon tools menu
router.get('/menu', getReconMenu);

// Web Recon Tools (protected)
router.post('/dns-lookup', protect, getDnsLookup);
router.post('/website-recon', protect, getWebsiteRecon);
router.post('/url-fuzzer', protect, getUrlFuzzer);

// Network & Cloud Recon Tools (protected)
router.post('/subdomain-finder', protect, getSubdomainFinder);
router.post('/port-scanner', protect, getPortScanner);

module.exports = router;
