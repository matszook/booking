// start.js
const { exec } = require('child_process');

async function openBrowser(url) {
  const { default: open } = await import('open'); // Dynamisk import
  return open(url);
}

// Start server.js
const server = exec('node Server.js');

server.stdout.on('data', data => {
  const message = data.toString();
  console.log(message);

  // Når serveren er klar, åpne nettsiden i nettleseren
  if (message.includes('Server kjører på http://localhost:3000')) {
    openBrowser('http://localhost:3000/Booking.html').catch(err => {
      console.error('Kunne ikke åpne nettleser automatisk:', err);
    });
  }
});

server.stderr.on('data', data => {
  console.error(data.toString());
}); 