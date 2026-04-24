const fs = require('fs');
const glob = require('glob');
const cp = require('child_process');

let output = cp.execSync("git status -s").toString();
let files = output.split('\n')
  .filter(line => line.startsWith(' M') || line.startsWith('??'))
  .map(line => line.substring(3).trim())
  .filter(line => line.endsWith('.tsx') || line.endsWith('.ts') || line.endsWith('.js'));

let count = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('�') || content.includes('�\x88')) {
      let bytes = Buffer.from(content, 'latin1');
      let restored = bytes.toString('utf8');
      
      // If it still has mojibake, maybe it wasn't latin1?
      if (!restored.includes('�')) {
          fs.writeFileSync(file, restored, 'utf8');
          console.log('Fixed:', file);
          count++;
      } else {
          console.log('Still has mojibake after decode:', file);
      }
  }
}
console.log('Total fixed:', count);
