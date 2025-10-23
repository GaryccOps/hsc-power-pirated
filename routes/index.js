import express from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import aiAgentsRouter from './aiAgents.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/ai-agents', aiAgentsRouter);

export default router;
