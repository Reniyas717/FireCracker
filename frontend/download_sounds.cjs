const https = require('https');
const fs = require('fs');

const files = {
  'deep_boom.ogg': 'https://actions.google.com/sounds/v1/explosions/distant_explosion.ogg',
  'pop.ogg': 'https://actions.google.com/sounds/v1/fireworks/firework_whistle_burst.ogg',
  'crackle.ogg': 'https://actions.google.com/sounds/v1/foley/glass_shatter_c.ogg'
};

Object.entries(files).forEach(([name, url]) => {
  https.get(url, (res) => {
    const file = fs.createWriteStream(`public/${name}`);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${name}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${name}:`, err.message);
  });
});
