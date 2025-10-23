import express from 'express';
import verifyJWT from '../middlewares/verifyJWT.js';
import { chat } from '../controllers/aiChat.js';

const router = express.Router();

// router.use(verifyJWT);

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/chat', chat);

export default router;
