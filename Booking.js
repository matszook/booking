// Booking.js
const roomSelect = document.getElementById('roomSelect');
const dateSelect = document.getElementById('dateSelect');
const durationSelect = document.getElementById('durationSelect');
const timeSlotsDiv = document.getElementById('timeSlots');
const bookingsTableBody = document.querySelector('#bookings tbody');

let bookings = [];

// API base: hvis siden kjøres fra file:// så fallback til http://localhost:3000
const API_BASE = (location.protocol === 'file:') ? 'http://localhost:3000' : '';
const BOOKINGS_API = `${API_BASE}/bookings`;

// Tidspunkter
const slots = [
  { start: "08:15", end: "09:00" },
  { start: "09:00", end: "09:45" },
  { start: "10:00", end: "10:45" },
  { start: "10:45", end: "11:30" },
  { start: "12:15", end: "13:00" },
  { start: "13:00", end: "13:45" },
  { start: "14:00", end: "14:45" },
  { start: "14:45", end: "15:30" }
];

function toDecimal(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

// Hent bookinger fra server
async function fetchBookings() {
  try {
    const res = await fetch(BOOKINGS_API);
    if (!res.ok) throw new Error(`Server svarte med status ${res.status}`);
    bookings = await res.json();
    console.log('Bookinger hentet fra server:', bookings);
    displayBookings();
    generateTimeSlots();
  } catch (err) {
    console.error('Feil ved henting av bookinger:', err);
    alert('Kunne ikke hente bookinger fra server. Sjekk at serveren kjører og at URL er korrekt.');
  }
}

// Generer time-slot knappene
function generateTimeSlots() {
  timeSlotsDiv.innerHTML = '';
  const room = roomSelect.value;
  const date = dateSelect.value;
  const duration = parseInt(durationSelect.value, 10);

  if (!date) {
    // Ikke vis slots før en dato er valgt
    timeSlotsDiv.innerHTML = '<p style="grid-column: 1 / -1; text-align:center; color:#666">Velg en dato for å se tilgjengelige tider.</p>';
    return;
  }

  for (let i = 0; i < slots.length; i++) {
    if (duration === 2 && i >= slots.length - 1) break;

    const slotRange = (duration === 1) ? [slots[i]] : [slots[i], slots[i + 1]];
    const startTime = slotRange[0].start;
    const endTime  = (duration === 1) ? slotRange[0].end : slotRange[1].end;
    const displayTime = `${startTime} - ${endTime}`;

    const btn = document.createElement('button');
    btn.textContent = displayTime;
    btn.dataset.start = startTime;
    btn.dataset.end = endTime;

    const booked = slotRange.some(s => isBooked(room, date, s.start, s.end));

    if (booked) {
      btn.classList.add('booked');
      btn.disabled = true;
    } else {
      btn.classList.add('available');
      btn.addEventListener('click', async function handler() {
        // Disable to unngå dobbeltklikk
        btn.disabled = true;
        try {
          await bookSlot(room, date, startTime, endTime, duration);
          // success: fetchBookings vil oppdatere UI
        } catch (err) {
          console.error('Booking feilet:', err);
          alert('Kunne ikke opprette booking. Se konsollen for detaljer.');
          btn.disabled = false;
        }
      });
    }

    timeSlotsDiv.appendChild(btn);
  }
}

// Sjekk overlapp
function isBooked(room, date, start, end) {
  const s = toDecimal(start);
  const e = toDecimal(end);
  return bookings.some(b => {
    if (b.room !== room || b.date !== date) return false;
    const bs = toDecimal(b.startTime);
    const be = toDecimal(b.endTime);
    return s < be && e > bs;
  });
}

// Opprett booking (POST)
async function bookSlot(room, date, startTime, endTime, duration) {
  const booking = { room, date, startTime, endTime, displayTime: `${startTime}-${endTime}`, duration };
  console.log('Prøver å poste booking:', booking);

  const res = await fetch(BOOKINGS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server returnerte ${res.status}: ${text}`);
  }

  const data = await res.json();
  console.log('POST ok:', data);
  // Oppdater lokale data fra server
  await fetchBookings();
}

// Avbestill (DELETE)
async function cancelBooking(index) {
  if (!confirm('Er du sikker på at du vil avbestille denne bookingen?')) return;
  try {
    const res = await fetch(`${BOOKINGS_API}/${index}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server returnerte ${res.status}: ${text}`);
    }
    const data = await res.json();
    console.log('DELETE ok:', data);
    await fetchBookings();
  } catch (err) {
    console.error('Feil ved avbestilling:', err);
    alert('Kunne ikke avbestille. Se konsollen.');
  }
}

// Vis bookings i tabellen
function displayBookings() {
  bookingsTableBody.innerHTML = '';
  if (!bookings || bookings.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Ingen bookinger ennå.';
    row.appendChild(cell);
    bookingsTableBody.appendChild(row);
    return;
  }

  bookings.forEach((b, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${b.room}</td>
      <td>${b.date}</td>
      <td>${b.startTime} - ${b.endTime}</td>
      <td>${b.duration} time(r)</td>
      <td><button class="cancel-btn">Avbestill</button></td>
    `;
    row.querySelector('.cancel-btn').addEventListener('click', () => cancelBooking(i));
    bookingsTableBody.appendChild(row);
  });
}

// Event listeners
roomSelect.addEventListener('change', generateTimeSlots);
dateSelect.addEventListener('change', generateTimeSlots);
durationSelect.addEventListener('change', generateTimeSlots);

// Init
fetchBookings();