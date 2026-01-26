// Create Electron-style atom icon with white outline and transparent background
const fs = require('fs');
const zlib = require('zlib');

function createPNG() {
    const width = 256;
    const height = 256;

    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk - RGBA (color type 6) for transparency
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData.writeUInt8(8, 8);         // bit depth
    ihdrData.writeUInt8(6, 9);         // color type 6 = RGBA
    ihdrData.writeUInt8(0, 10);
    ihdrData.writeUInt8(0, 11);
    ihdrData.writeUInt8(0, 12);

    const ihdrChunk = createChunk('IHDR', ihdrData);

    // IDAT chunk (image data) - RGBA = 4 bytes per pixel
    const rawData = Buffer.alloc(height * (1 + width * 4));

    const centerX = width / 2;
    const centerY = height / 2;

    // Electron orbits parameters - THICKER lines for visibility
    const orbitRadiusX = 95;
    const orbitRadiusY = 38;
    const lineWidth = 16;
    const nucleusRadius = 35;

    for (let y = 0; y < height; y++) {
        const rowStart = y * (1 + width * 4);
        rawData[rowStart] = 0; // filter type: none

        for (let x = 0; x < width; x++) {
            const pixelStart = rowStart + 1 + x * 4;

            // Check if pixel is part of the electron icon
            let isIcon = false;

            // Check nucleus (center circle)
            const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (distFromCenter <= nucleusRadius) {
                isIcon = true;
            }

            // Check three elliptical orbits at different angles
            const angles = [0, Math.PI / 3, -Math.PI / 3];
            for (const angle of angles) {
                // Rotate point to check against axis-aligned ellipse
                const cos = Math.cos(-angle);
                const sin = Math.sin(-angle);
                const rx = (x - centerX) * cos - (y - centerY) * sin;
                const ry = (x - centerX) * sin + (y - centerY) * cos;

                // Check if on ellipse edge (within line width) - THICKER for visibility
                const ellipseVal = Math.pow(rx / orbitRadiusX, 2) + Math.pow(ry / orbitRadiusY, 2);
                if (Math.abs(ellipseVal - 1) < 0.25) {
                    isIcon = true;
                }
            }

            if (isIcon) {
                // White color with full opacity
                rawData[pixelStart] = 255;     // R
                rawData[pixelStart + 1] = 255; // G
                rawData[pixelStart + 2] = 255; // B
                rawData[pixelStart + 3] = 255; // A (opaque)
            } else {
                // Transparent
                rawData[pixelStart] = 0;
                rawData[pixelStart + 1] = 0;
                rawData[pixelStart + 2] = 0;
                rawData[pixelStart + 3] = 0;   // A (transparent)
            }
        }
    }

    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = [];

    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }

    for (let i = 0; i < data.length; i++) {
        crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
}

const png = createPNG();
fs.writeFileSync('icon.png', png);
console.log('Created icon.png - white electron atom with transparent background');
