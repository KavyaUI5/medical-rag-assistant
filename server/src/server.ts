import 'dotenv/config';

import app from './app.js';

const port = Number(
  process.env.PORT ?? 5000,
);

if (!Number.isInteger(port) || port < 1) {
  throw new Error(
    'PORT must be a valid positive integer.',
  );
}

app.listen(port, () => {
  console.log(
    `Medical RAG server running at http://localhost:${port}`,
  );
});