const ts = require('typescript');
const fs = require('fs'); const path = require('path');
const root = process.cwd();
let errors = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir,{withFileTypes:true})) {
    if (f.name === 'node_modules') continue;
    const p = path.join(dir,f.name);
    if (f.isDirectory()) walk(p);
    else if ((p.endsWith('.ts') || p.endsWith('.tsx')) && !p.endsWith('.d.ts')) {
      const text = fs.readFileSync(p,'utf8');
      let result; try { result = ts.transpileModule(text,{compilerOptions:{target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, experimentalDecorators:true},fileName:p,reportDiagnostics:true}); } catch (e) { errors.push(`${p}: ${e.message}`); continue; }
      const ds = result.diagnostics || [];
      if (ds.length) errors.push(...ds.map(d=>`${p}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`));
    }
  }
}
walk(path.join(root,'src'));
console.log(`Syntactic transpile: ${errors.length} issues`); console.log(errors.slice(0,30).join('\n'));
process.exitCode = errors.length ? 1 : 0;
