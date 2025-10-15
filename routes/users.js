var express = require('express');
var router = express.Router();
const bookController = require('../controllers/bookController');
const verifyJWT = require('../middlewares/verifyJWT');

router.use(verifyJWT);
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// POST /books
router.post('/add_book', bookController.addBook);

module.exports = router;
