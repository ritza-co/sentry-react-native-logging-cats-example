require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH || './database.db';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err);
      }
    });
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Cats table
    db.run(`
      CREATE TABLE IF NOT EXISTS cats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        external_id TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating cats table:', err);
    });

    // Votes table
    db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cat_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cat_id) REFERENCES cats(id)
      )
    `, (err) => {
      if (err) console.error('Error creating votes table:', err);
    });

    // Monthly winners table
    db.run(`
      CREATE TABLE IF NOT EXISTS monthly_winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cat_id INTEGER NOT NULL,
        month_year TEXT NOT NULL,
        upvote_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cat_id) REFERENCES cats(id)
      )
    `, (err) => {
      if (err) console.error('Error creating monthly_winners table:', err);
    });
  });
}

// Routes

// Get all cats with vote counts
app.get('/api/cats', (req, res) => {
  const query = `
    SELECT 
      cats.id,
      cats.image_url,
      SUM(CASE WHEN votes.vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
      SUM(CASE WHEN votes.vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
    FROM cats
    LEFT JOIN votes ON cats.id = votes.cat_id
    GROUP BY cats.id
    ORDER BY upvotes DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching cats:', err);
      return res.status(500).json({ error: 'Failed to fetch cats' });
    }
    res.json(rows || []);
  });
});

// Get current month's winner
app.get('/api/winner', (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  const query = `
    SELECT 
      cats.id,
      cats.image_url,
      monthly_winners.upvote_count
    FROM monthly_winners
    JOIN cats ON monthly_winners.cat_id = cats.id
    WHERE monthly_winners.month_year = ?
    ORDER BY monthly_winners.upvote_count DESC
    LIMIT 1
  `;

  db.get(query, [currentMonth], (err, row) => {
    if (err) {
      console.error('Error fetching winner:', err);
      return res.status(500).json({ error: 'Failed to fetch winner' });
    }
    res.json(row || null);
  });
});

// Add a vote
app.post('/api/votes', (req, res) => {
  const { cat_id, vote_type } = req.body;

  if (!cat_id || !vote_type || !['upvote', 'downvote'].includes(vote_type)) {
    return res.status(400).json({ error: 'Invalid cat_id or vote_type' });
  }

  const query = `INSERT INTO votes (cat_id, vote_type) VALUES (?, ?)`;

  db.run(query, [cat_id, vote_type], (err) => {
    if (err) {
      console.error('Error adding vote:', err);
      return res.status(500).json({ error: 'Failed to add vote' });
    }
    res.json({ success: true, message: 'Vote recorded' });
  });
});

// Add cats (called when fetching from Cat API)
app.post('/api/cats', (req, res) => {
  const { cats } = req.body;

  if (!Array.isArray(cats) || cats.length === 0) {
    return res.status(400).json({ error: 'Invalid cats data' });
  }

  let inserted = 0;
  cats.forEach((cat) => {
    const query = `INSERT OR IGNORE INTO cats (image_url, external_id) VALUES (?, ?)`;
    db.run(query, [cat.url, cat.id], (err) => {
      if (err) {
        console.error('Error inserting cat:', err);
      } else {
        inserted++;
      }
    });
  });

  res.json({ success: true, inserted });
});

// Clear all data (cats, votes, winners)
app.post('/api/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM votes', (err) => {
      if (err) console.error('Error clearing votes:', err);
    });
    db.run('DELETE FROM monthly_winners', (err) => {
      if (err) console.error('Error clearing winners:', err);
    });
    db.run('DELETE FROM cats', (err) => {
      if (err) console.error('Error clearing cats:', err);
    });
  });

  res.json({ success: true, message: 'Database cleared' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database...');
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
    process.exit(0);
  });
});
