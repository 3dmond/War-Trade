const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const BROWSER_GLOBALS = new Set([
  'window', 'document', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'Math', 'Date', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Map', 'Set',
  'Promise', 'Error', 'TypeError', 'ReferenceError', 'fetch', 'URL', 'URLSearchParams',
  'localStorage', 'sessionStorage', 'navigator', 'location', 'history', 'requestAnimationFrame',
  'cancelAnimationFrame', 'Event', 'CustomEvent', 'AbortController', 'Blob', 'File', 'FileReader',
  'FormData', 'Headers', 'Request', 'Response', 'btoa', 'atob', 'encodeURIComponent',
  'decodeURIComponent', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Infinity', 'NaN', 'undefined',
  'Intl', 'process', 'globalThis', 'self', 'performance', 'alert', 'confirm', 'prompt',
  'HTMLInputElement', 'HTMLButtonElement', 'HTMLElement', 'Element', 'Node', 'MutationObserver',
  'ResizeObserver', 'IntersectionObserver', 'SVGElement', 'SVGDefsElement', 'SVGCircleElement'
]);

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'scripts' && file !== 'node_modules') {
        results = results.concat(getFiles(fullPath));
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(path.resolve(__dirname, '../'));
console.log(`Scanning ${files.length} files in src/...`);

let foundIssues = 0;

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (err) {
    console.error(`Parse error in ${filePath}: ${err.message}`);
    return;
  }

  const undeclaredInFile = [];

  traverse(ast, {
    Identifier(path) {
      const name = path.node.name;
      const parent = path.parent;

      // Skip property in member expression: obj.prop or obj?.prop
      if ((parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression') &&
          parent.property === path.node && !parent.computed) {
        return;
      }
      // Skip object property key: { prop: val }
      if (parent.type === 'ObjectProperty' && parent.key === path.node && !parent.computed) {
        return;
      }
      // Skip method key
      if ((parent.type === 'ObjectMethod' || parent.type === 'ClassMethod' || parent.type === 'ClassProperty') &&
          parent.key === path.node) {
        return;
      }
      // Skip JSX attribute name: <div attr="val" />
      if (parent.type === 'JSXAttribute') {
        return;
      }
      // Skip export specifier when exporting existing binding: export { X } from 'y'
      if (parent.type === 'ExportSpecifier') {
        if (path.parentPath?.parent?.source) {
          // It's export { foo } from 'bar';
          return;
        }
      }
      // Skip labels or typescript types
      if (parent.type === 'LabeledStatement') return;
      if (parent.type.startsWith('TS')) return;

      // Check if identifier is in scope
      if (!path.scope.hasBinding(name) && !BROWSER_GLOBALS.has(name)) {
        undeclaredInFile.push({ name, line: path.node.loc?.start?.line });
      }
    }
  });

  if (undeclaredInFile.length > 0) {
    console.log(`\nIssues in ${path.relative(process.cwd(), filePath)}:`);
    undeclaredInFile.forEach(({ name, line }) => {
      console.log(`  - Line ${line}: undeclared identifier '${name}'`);
      foundIssues++;
    });
  }
});

console.log(`\nScan finished. Total undeclared identifier issues: ${foundIssues}`);
