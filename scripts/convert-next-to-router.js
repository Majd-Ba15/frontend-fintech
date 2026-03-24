const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      results = results.concat(walk(fp));
    } else if (/\.tsx?$/.test(file)) {
      results.push(fp);
    }
  }
  return results;
}

const files = walk(process.cwd());
for (const file of files) {
  let txt = fs.readFileSync(file, 'utf8');
  const old = txt;

  txt = txt.replace(/import\s+\{\s*useRouter\s*\}\s+from\s+'next\/navigation';/g, "import { useNavigate } from 'react-router-dom';");
  txt = txt.replace(/import\s+\{\s*usePathname\s*\}\s+from\s+'next\/navigation';/g, "import { useLocation } from 'react-router-dom';");
  txt = txt.replace(/import Link from 'next\/link';/g, "import { Link } from 'react-router-dom';");

  txt = txt.replace(/const\s+router\s*=\s*useRouter\(\);/g, 'const navigate = useNavigate();');
  txt = txt.replace(/router\.push\(/g, 'navigate(');
  txt = txt.replace(/router\.back\(\)/g, 'navigate(-1)');

  txt = txt.replace(/const\s+pathname\s*=\s*usePathname\(\);/g, 'const pathname = useLocation().pathname;');

  txt = txt.replace(/import\s+\{\s*use\s*\}\s+from\s+'react';/g, "import { useParams } from 'react-router-dom';");
  txt = txt.replace(/export default function (\w+)\s*\(\{\s*params\s*\}:\s*\{[^}]*\}\)\s*\{/g, 'export default function $1() {');
  txt = txt.replace(/const\s+\{\s*id\s*\}\s*=\s*use\(params\);/g, 'const { id } = useParams();');

  if (txt.includes('useParams()') && !old.includes('useParams')) {
    const m = txt.match(/import.*?from 'react-router-dom';/);
    if (m) {
      txt = txt.replace(m[0], m[0].replace('import {', 'import { useParams,'));
    }
  }

  if (txt !== old) {
    fs.writeFileSync(file, txt);
    console.log('updated', file);
  }
}
