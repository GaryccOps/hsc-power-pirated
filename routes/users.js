var express = require('express');
var router = express.Router();
const verifyJWT = require('../middlewares/verifyJWT');

router.use(verifyJWT);
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


module.exports = router;
