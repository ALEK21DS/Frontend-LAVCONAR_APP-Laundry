/**
 * Script para generar todos los tamaños de iconos de Android desde icono-App.png
 * 
 * Uso: node scripts/generate-icons.js
 * 
 * Requiere: npm install --save-dev sharp
 */

const fs = require('fs');
const path = require('path');

// Tamaños requeridos para cada densidad
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Tamaño para el foreground del icono adaptativo
const foregroundSize = 432; // 1024 * 0.432 (safe zone para iconos adaptativos)

const sourceIcon = path.join(__dirname, '../src/assets/icono-App.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Verificar si sharp está disponible
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('ERROR: sharp no está instalado.');
  console.error('Por favor ejecuta: npm install --save-dev sharp');
  process.exit(1);
}

// Verificar que el archivo fuente existe
if (!fs.existsSync(sourceIcon)) {
  console.error(`ERROR: No se encontró el archivo fuente: ${sourceIcon}`);
  process.exit(1);
}

async function generateIcons() {
  console.log('Generando iconos de Android...');
  console.log(`Archivo fuente: ${sourceIcon}`);

  try {
    // Generar iconos para cada densidad
    for (const [folder, size] of Object.entries(iconSizes)) {
      const folderPath = path.join(androidResPath, folder);
      
      // Crear carpeta si no existe
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const outputPath = path.join(folderPath, 'ic_launcher.png');
      const roundOutputPath = path.join(folderPath, 'ic_launcher_round.png');

      console.log(`Generando ${size}x${size}px -> ${folder}/`);

      // Generar ic_launcher.png (cuadrado)
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(outputPath);

      // Generar ic_launcher_round.png (mismo tamaño, se redondea automáticamente en Android)
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(roundOutputPath);

      console.log(`  ✓ ${outputPath}`);
      console.log(`  ✓ ${roundOutputPath}`);
    }

    // Generar foreground para icono adaptativo
    const foregroundPath = path.join(androidResPath, 'mipmap-anydpi-v26');
    if (!fs.existsSync(foregroundPath)) {
      fs.mkdirSync(foregroundPath, { recursive: true });
    }

    // Generar en diferentes densidades para el foreground (se necesita en cada carpeta mipmap-*)
    for (const [folder] of Object.entries(iconSizes)) {
      const foregroundOutputPath = path.join(androidResPath, folder, 'ic_launcher_foreground.png');
      const size = iconSizes[folder];

      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(foregroundOutputPath);

      console.log(`  ✓ ${foregroundOutputPath}`);
    }

    console.log('\n¡Iconos generados exitosamente!');
    console.log('\nNota: El icono adaptativo ya está configurado en mipmap-anydpi-v26/ic_launcher.xml');
    
  } catch (error) {
    console.error('ERROR al generar iconos:', error);
    process.exit(1);
  }
}

// Ejecutar
generateIcons();


