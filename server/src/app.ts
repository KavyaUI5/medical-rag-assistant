import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import ragRoutes from './routes/ragRoutes.js';

const clientOrigin =
    process.env.CLIENT_ORIGIN ??
    'http://localhost:5173';

export const app = express();

app.use(
    cors({
        origin: clientOrigin,
    }),
);

app.use(
    express.json({
        limit: '1mb',
    }),
);

app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Medical RAG server is running.',
    });
});

app.use('/api/rag', ragRoutes);

app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found.',
    });
});

export default app;