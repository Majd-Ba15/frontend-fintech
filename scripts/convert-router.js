const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git') continue;
      results = results.concat(getFiles(full));
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const root = process.cwd();
const files = getFiles(root);
let modifiedFiles = [];

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  let updated = src;

  updated = updated.replace(/import \{ useRouter \} from 'next\/navigation';/g, "import { useNavigate } from 'react-router-dom';");
  updated = updated.replace(/import \{ usePathname \} from 'next\/navigation';/g, "import { useLocation } from 'react-router-dom';");
  updated = updated.replace(/import Link from 'next\/link';/g, "import { Link } from 'react-router-dom';");

  // convert href= to to= on Link elements
  updated = updated.replace(/<Link([^>]*?)\s+href="([^"]*)"/g, '<Link$1 to="$2"');

  updated = updated.replace(/const router = useRouter\(\);/g, 'const navigate = useNavigate();');
  updated = updated.replace(/router\.push\(/g, 'navigate(');
  updated = updated.replace(/router\.replace\(/g, 'navigate('); 
  updated = updated.replace(/router\.back\(\)/g, 'navigate(-1)');

  // usePathname to useLocation().pathname
  updated = updated.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*usePathname\(\);/g, 'const $1 = useLocation().pathname;');

  // convert Next params function
  if (/use\(params\)/.test(updated) || /params:\s*Promise/.test(updated)) {
    updated = updated.replace(/import \{ use \} from 'react';\n/, "import { useParams } from 'react-router-dom';\n");

    // convert function signature with params to no params
    updated = updated.replace(/export default function ([a-zA-Z0-9_]+)\s*\(\s*\{\s*params[^}]*\}\s*:\s*\{[^}]*\}\s*\)\s*\{/g, 'export default function $1() {');
    updated = updated.replace(/const \{\s*id\s*\} = use\(params\);/g, 'const { id } = useParams();');

    if (!/useParams/.test(updated)) {
      // attempt to add useParams to imports from react-router-dom if react import exists
      updated = updated.replace(/import \{([^}]*)\} from 'react-router-dom';/, (match, group) => {
        const items = group.split(',').map((item) => item.trim());
        if (!items.includes('useParams')) {
          items.push('useParams');
        }
        return `import { ${items.join(', ')} } from 'react-router-dom';`;
      });
    }
  }

  if (updated !== src) {
    fs.writeFileSync(file, updated, 'utf8');
    modifiedFiles.push(file);
  }
}

console.log('Modified files:', modifiedFiles.length);
if (modifiedFiles.length > 0) console.log(modifiedFiles.join('\n'));
