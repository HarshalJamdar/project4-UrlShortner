const express = require('express');
const router = express.Router();
const {createShortUrl,getShortUrl} = require("../controllers/controller");
const createShortUrlLimiter = require('../middleware/rateLimiter');

//--Create short URL
router.post("/url/shorten", createShortUrlLimiter,createShortUrl)

//--Get short URL
router.get("/:urlCode",getShortUrl)

module.exports=router