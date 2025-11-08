import 'dotenv/config';
import express from 'express';
import callRoutes from './routes/callRoutes.js';

const app = express();
app.use(express.json());

// Use call routes
app.use('/api/calls', callRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
