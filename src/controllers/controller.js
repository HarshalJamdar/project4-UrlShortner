require('dotenv').config({ path: __dirname + '/../.env', debug: true });
const validUrl = require("valid-url")
const shortid = require("shortid")
const redis = require("redis");
const urlModel = require("../models/urlModel")

// Create client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

// Listen for errors
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis!");
    } catch (err) {
        console.error("Could not connect to Redis:", err);
    }
})();

// Helper functions for async/await usage
const SET_ASYNC = (key, value, ...args) => redisClient.set(key, value, ...args);
const GET_ASYNC = (key) => redisClient.get(key);

//---CREATE SHORT URL
const createShortUrl= async function(req,res){
    try{
        //==defining baseUrl==//
        const baseUrl = process.env.BASE_URL
       
        //==validating request body==//
        if(Object.keys(req.body).length==0) return res.status(400).send({status: false, message: "Invalid request, please provide details"})

        //==validating long url==//
        let longUrl=req.body.longUrl.trim()
        if (!validUrl.isUri(longUrl)) return res.status(400).send({status: false, message: "Invalid long URL"})
        
        //==checking cache==//
        let fetchLongUrl = await GET_ASYNC(`${longUrl}`)
        const newData = JSON.parse(fetchLongUrl)//converting in JSON
        if(fetchLongUrl) return res.status(200).send({status: true, data : newData})

        //==ckecking and sending shorturl==//
        let url = await urlModel.findOne({longUrl:longUrl}).select({_id:0,longUrl:1,shortUrl:1,urlCode:1})
        await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(url))
        if(url) return res.status(200).send({status: true, data : url})

        //==creating shorturl and url document==//
        let urlCode = shortid.generate(longUrl).toLowerCase()
        let shortUrl = baseUrl + '/' + urlCode
        let Url = await urlModel.create({longUrl,shortUrl,urlCode})

        //==creating object to get only required keys==/
        let data ={longUrl,shortUrl,urlCode}

        //==setting  data in cache and sending response==//
        await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(data),"Ex",100)//setting expairy of cache storage-life for 100s.
        await SET_ASYNC(`${urlCode}`, JSON.stringify(longUrl),"Ex",100);

        return res.status(201).send({status: true, data : data}) 
    }catch (err) {
     return res.status(500).send({ status: false, error: err.message })
    }
}


//---GET SHORT URL 
const getShortUrl = async function (req, res) {
  //await clearAllCache(redisClient);
  try {
      //==checking for url code in cache==//
      const cachedUrlData = await GET_ASYNC(`${req.params.urlCode}`)
      const parsingData = JSON.parse(cachedUrlData);
      if(cachedUrlData) return res.status(302).redirect(parsingData) 
        
      //==checking for url code in url collection==//
      const urlData = await urlModel.findOne({ urlCode: req.params.urlCode.trim() })  
      if (!urlData)   // doc not found in url collection
          return res.status(404).send({status: false, message: "No URL Found "});

      //==url code found and now setting in cache and redirecting to original url==// 
      await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(urlData.longUrl),"Ex",100);
      return res.status(302).redirect(urlData.longUrl)    
  }
  catch (error) {
      res.status(500).send({ status: false, error: error.message });
  }
}

const clearAllCache = async (redisClient) => {
  try {
    // Flush all keys in the CURRENT database only
    await redisClient.flushDb();
    console.log("✅ All Redis cache cleared (current DB).");
    return { status: true, message: "All Redis cache cleared." };
  } catch (err) {
    console.error("❌ Error clearing Redis cache:", err);
    return { status: false, message: err.message };
  }
};

module.exports={createShortUrl,getShortUrl}