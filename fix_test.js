const fs = require('fs');
const iconv = require('iconv-lite');
const path = require('path');

const files = [
  "src/app/explore/page.tsx"
];

for (const file of files) {
  let f = path.join(__dirname, file);
  if (!fs.existsSync(f)) continue;
  
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('�')) {
      let bytes = iconv.encode(content, 'win1252');
      let restored = iconv.decode(bytes, 'utf8');
      if (restored.includes('')) {
        bytes = Buffer.from(content, 'latin1');
        restored = bytes.toString('utf8');
      }
      fs.writeFileSync(f, restored, 'utf8');
      console.log('Fixed:', file);
  }
}
