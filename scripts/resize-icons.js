const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure assets/images directory exists
const imagesDir = path.join(__dirname, '..', 'assets', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Resize main icon to 1024x1024
sharp(path.join(imagesDir, 'icon.png'))
  .resize(1024, 1024)
  .png()
  .toFile(path.join(imagesDir, 'icon-1024.png'))
  .then(() => console.log('Main icon resized to 1024x1024'))
  .catch(err => console.error('Error resizing main icon:', err));

// Resize Android adaptive icons to 108x108
const androidIcons = [
  'ic_launcher.png',
  'ic_launcher_background.png',
  'ic_launcher_foreground.png',
  'ic_launcher_monochrome.png'
];

androidIcons.forEach(icon => {
  const iconPath = path.join(imagesDir, icon);
  if (fs.existsSync(iconPath)) {
    sharp(iconPath)
      .resize(108, 108)
      .png()
      .toFile(path.join(imagesDir, `${icon.split('.')[0]}-108.png`))
      .then(() => console.log(`${icon} resized to 108x108`))
      .catch(err => console.error(`Error resizing ${icon}:`, err));
  }
});

// Resize favicon to 48x48
sharp(path.join(imagesDir, 'favicon.png'))
  .resize(48, 48)
  .png()
  .toFile(path.join(imagesDir, 'favicon-48.png'))
  .then(() => console.log('Favicon resized to 48x48'))
  .catch(err => console.error('Error resizing favicon:', err));