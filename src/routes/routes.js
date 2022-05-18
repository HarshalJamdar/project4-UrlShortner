const express = require('express');
const router = express.Router();
const {createShortUrl,getShortUrl} = require("../controllers/controller")

//--Create short URL
router.post("/url/shorten",createShortUrl)
//router.post('/urls/shorten', fetchLongUrl)
//--Get short URL
router.get("/:urlCode",getShortUrl)

module.exports=router