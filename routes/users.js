var express = require('express');
var router = express.Router();
const verifyJWT = require('../middlewares/verifyJWT');
const aiAgent = require('../controllers/aiChat');
// router.use(verifyJWT);
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/chat', aiAgent.chat);



module.exports = router;
