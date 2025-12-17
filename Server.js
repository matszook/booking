// Server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'Booking.json');

app.use(cors());
app.use(express.json());

// Serve static files (så du kan åpne http://localhost:3000/Booking.html)
app.use(express.static(__dirname));

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  console.log('Opprettet tom Booking.json');
}

function readBookings() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Feil ved lesing av Booking.json:', err);
    return [];
  }
}

function writeBookings(bookings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), 'utf8');
  } catch (err) {
    console.error('Feil ved skriving til Booking.json:', err);
    throw err;
  }
}

// GET /bookings
app.get('/bookings', (req, res) => {
  try {
    const bookings = readBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Kunne ikke lese bookinger' });
  }
});

// POST /bookings
app.post('/bookings', (req, res) => {
  try {
    const booking = req.body;
    // Enkel validering
    if (!booking || !booking.room || !booking.date || !booking.startTime || !booking.endTime) {
      return res.status(400).json({ message: 'Ugyldig booking (mangler felt).' });
    }

    const bookings = readBookings();
    bookings.push(booking);
    writeBookings(bookings);
    console.log('[POST] Booking lagt til:', booking);
    res.status(201).json({ message: 'Booking lagt til', booking });
  } catch (err) {
    console.error('POST error:', err);
    res.status(500).json({ message: 'Kunne ikke legge til booking' });
  }
});

// DELETE /bookings/:index
app.delete('/bookings/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    const bookings = readBookings();
    if (Number.isNaN(index) || index < 0 || index >= bookings.length) {
      return res.status(400).json({ message: 'Ugyldig index' });
    }
    const removed = bookings.splice(index, 1)[0];
    writeBookings(bookings);
    console.log('[DELETE] Booking fjernet:', removed);
    res.json({ message: 'Booking fjernet', removed });
  } catch (err) {
    console.error('DELETE error:', err);
    res.status(500).json({ message: 'Kunne ikke fjerne booking' });
  }
});

app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));