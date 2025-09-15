const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Basic middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Minimal backend is running'
  });
});

// Mock API endpoints
app.get('/api/boards', (req, res) => {
  res.json([
    { id: 1, name: 'Sample Board', description: 'Demo board' }
  ]);
});

app.get('/api/boards/:boardId/columns', (req, res) => {
  res.json([
    { id: 1, name: 'To Do', position: 0, cards: [] },
    { id: 2, name: 'In Progress', position: 1, cards: [] },
    { id: 3, name: 'Done', position: 2, cards: [] }
  ]);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
