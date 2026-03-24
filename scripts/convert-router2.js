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

  // If existing import from react-router-dom and also another Link import, ensure no duplicate
  // fix pattern like import { useNavigate } from 'react-router-dom';\nimport { Link } from 'react-router-dom'; -> import { useNavigate, Link } from 'react-router-dom';
  updated = updated.replace(/import \{([^}]*)\} from 'react-router-dom';\s*\n\s*import \{\s*Link\s*\} from 'react-router-dom';/g, (m, group) => {
    const items = group.split(',').map(i => i.trim()).filter(Boolean);
    if (!items.includes('Link')) items.push('Link');
    return `import { ${items.join(', ')} } from 'react-router-dom';`;
  });

  // convert href= to to= on Link elements
  updated = updated.replace(/<Link([^>]*?)\s+href="([^"]*)"/g, '<Link$1 to="$2"');

  updated = updated.replace(/const router = useRouter\(\);/g, 'const navigate = useNavigate();');
  updated = updated.replace(/router\.push\(/g, 'navigate(');
  updated = updated.replace(/router\.replace\(/g, 'navigate(');
  updated = updated.replace(/router\.back\(\)/g, 'navigate(-1)');

  updated = updated.replace(/\busePathname\(\)/g, 'useLocation().pathname');

  if (/use\(params\)/.test(updated) || /params:\s*Promise/.test(updated)) {
    updated = updated.replace(/import \{ use \} from 'react';/g, "import { useParamslate } from 'react';");
    updated = updated.replace(/const \{\s*id\s*\} = use\(params\);/g, 'const { id } = useParams();');
    updated = updated.replace(/export default function ([a-zA-Z0-9_]+)\s*\(\s*\{\s*params[^}]*\}\s*:\s*\{[^}]*\}\s*\)\s*\{/g, 'export default function $1() {');
  }

  // update fn internal router.push with navigate if still present
  updated = updated.replace(/\brouter\.push\('/g, "navigate('");

  // fix with developer using router var elsewhere
  if (!/useNavigate/.test(updated) && /router\./.test(updated)) {
    // if router variable is used and no useNavigate import, add import
    if (/import \{[^}]*\} from 'react-router-dom';/.test(updated)) {
      updated = updated.replace(/import \{([^}]*)\} from 'react-router-dom';/, (match, group) => {
        const items = group.split(',').map(i => i.trim()).filter(Boolean);
        if (!items.includes('useNavigate')) items.push('useNavigate');
        return `import { ${items.join(', ')} } from 'react-router-dom';`;
      });
    } else {
      updated = `import { useNavigate } from 'react-router-dom';\n${updated}`;
    }
    updated = updated.replace(/const router = useRouter\(\);/g, 'const navigate = useNavigate();');
    updated = updated.replace(/router\.back\(\)/g, 'navigate(-1)');
    updated = updated.replace(/router\.push\(/g, 'navigate(');
  }

  // fallback: if link imported from react-router and has href attr still, convert
  if (/Link[^>]*href=/.test(updated)) {
    updated = updated.replace(/<Link([^>]*?)\s+href="([^"]*)"/g, '<Link$1 to="$2"');
  }

  // final sanitize: remove next import leftovers with optional semicolon
  updated = updated.replace(/\nimport \{?[^;]*\}? from 'next\/[a-z]+';?/g, '');

  // fix for a bug introduced above: accidentally changed import with useParamslate
  updated = updated.replace(/import \{ useParamslate \} from 'react';/g, "import { useParams } from 'react-router-dom';");

  if (updated !== src) {
    fs.writeFileSync(file, updated, 'utf8');
    modifiedFiles.push(file);
  }
}

console.log('Modified files:', modifiedFiles.length);
if (modifiedFiles.length > 0) console.log(modifiedFiles.join('\n'));
