const fs = require('fs');
const glob = require('glob');

function fixMojibake(text) {
  // If the text has no mojibake, returning it safely is hard, 
  // but we can try to find chunks of arabic that got double-encoded.
  // UTF-8 Arabic letters are D8 xx to D9 xx.
  // In CP1252, D8 is �, D9 is �. 
  // So we look for � or �. 
  // Let's just do a full decode and see if it looks like Arabic.
  try {
    // The mojibake is UTF-8 encoded sequence of CP1252 bytes.
    // Let's take the string, convert it to buffer using 'binary' (latin1),
    // and then parse that buffer as utf8.
    // If it contains valid Arabic, we use it.
    let buf = Buffer.from(text, 'latin1');
    let decoded = buf.toString('utf8');
    
    // We only want to replace chunks that have actual mojibake.
    // If we do the whole file, valid english strings will become corrupt if they have accented latin chars?
    // Wait, let's just do the whole file but be careful.
    // Actually, doing the whole file:
    // If text only contains ASCII, latin1 buffer to utf8 string is an identity operation!
    // But if text contains Real Arabic (already correct), buffer.from('utf8').toString('utf8') ... wait.
    // Let's test on a specific file:
    return decoded;
  } catch (e) {
    return text;
  }
}

const file = 'src/components/dashboard/courses-table.tsx';
let data = fs.readFileSync(file, 'utf8');
let buf = Buffer.from(data, 'latin1'); // This will truncate multi-byte! 
console.log("Original has �:", data.includes('�'));

// Since data was read as utf8, each char is a unicode code point.
// If the file was saved as utf8 representation of cp1252, then chars are <= 0xFF.
// Wait, windows-1252 has some characters that map to > 0xFF (e.g. � is U+20AC, but byte 0x80).
// If the mojibake was created by reading UTF-8 bytes as CP1252, then saving as UTF-8:
// We need to encode the JS string to CP1252, yielding the original UTF-8 bytes, then decode as UTF-8.
const iconv = require('iconv-lite');
// Let's install iconv-lite:
