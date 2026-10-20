// Packs the same tested source into one offline HTML. Original Unity art is read only.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const embeddedArt = {};
for (const name of ['stand', 'run', 'jump', 'hit']) {
  embeddedArt[name] = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', `miko_${name}_transparent.png`)).toString('base64');
}
let renderer = read('renderer.js');
const reference = 'img.src = `assets/miko_${name}_transparent.png`;';
if (!renderer.includes(reference)) throw new Error('Sprite reference changed; update the packer before delivery.');
renderer = renderer.replace(reference, `img.src = ${JSON.stringify(embeddedArt)}[name];`);
const ghostReference = "this.ghostImage.src = 'assets/easy_ghost.png';";
if (!renderer.includes(ghostReference)) throw new Error('Ghost reference changed; update the packer.');
const ghostData = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', 'easy_ghost.png')).toString('base64');
renderer = renderer.replace(ghostReference, `this.ghostImage.src = ${JSON.stringify(ghostData)};`);
const scripts = [read('i18n.js'), read('engine.js'), renderer, read('app.js')];
let html = read('index.html')
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${read('styles.css')}\n</style>`)
  .replace(/  <script defer src="(?:i18n|engine|renderer|app)\.js"><\/script>\n/g, '')
  .replace('</body>', scripts.map(code => `<script>\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n') + '\n</body>')
  .replace('href="./"', 'href="#"');
if (/src="(?:i18n|engine|renderer|app)\.js"|href="styles\.css"|img\.src = `assets\//.test(html)) throw new Error('Offline bundle still contains an external file reference.');
const output = path.join(root, '打爆南瓜.html');
fs.writeFileSync(output, html);
console.log(`Offline HTML ready: ${output} (${fs.statSync(output).size} bytes)`);
