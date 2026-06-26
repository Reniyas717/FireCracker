const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/WesBos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds/boom.wav';
const dest = 'public/explosion.wav';

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      console.log('Download complete.');
    });
  } else {
    console.error(`Failed to download: ${response.statusCode}`);
  }
}).on('error', function(err) {
  console.error('Error: ', err.message);
});
