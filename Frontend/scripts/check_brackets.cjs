const fs = require('fs');
const path = 'D:/Thenuga/MauvalPrint/Frontend/src/Products/SingleProductView.jsx';
const s = fs.readFileSync(path,'utf8');
let stack = [];
let line = 1, col = 0;
let inSingle=false, inDouble=false, inBack=false, inLineComment=false, inBlockComment=false;
for(let i=0;i<s.length;i++){
  const ch=s[i];
  col++;
  if(ch==='\n'){ line++; col=0; inLineComment=false; }
  if(inLineComment || inBlockComment){
    if(!inLineComment && ch==='*' && s[i+1]=='/') { inBlockComment=false; i++; col++; }
    continue;
  }
  if(!inSingle && !inDouble && !inBack){
    if(ch==='/' && s[i+1]=='/') { inLineComment=true; i++; col++; continue; }
    if(ch==='/' && s[i+1]=='*') { inBlockComment=true; i++; col++; continue; }
  }
  if(!inLineComment && !inBlockComment){
    if(ch==='"' && !inSingle && !inBack){ inDouble = !inDouble; continue; }
    if(ch==="'" && !inDouble && !inBack){ inSingle = !inSingle; continue; }
    if(ch==='`' && !inSingle && !inDouble) { inBack = !inBack; continue; }
    if(inSingle || inDouble || inBack){
      if(ch==='\\') { i++; col++; continue; }
      continue;
    }
    if(ch==='('||ch==='{'||ch==='['){ stack.push({ch,line,col,pos:i}); }
    else if(ch===')' || ch==='}' || ch===']'){
      const last=stack[stack.length-1];
      if(!last){ console.log(`Unmatched closing ${ch} at ${line}:${col}`); }
      else{
        const pairs={'(':')','{':'}','[':']'};
        if(pairs[last.ch]===ch) stack.pop();
        else console.log(`Mismatched ${last.ch} opened at ${last.line}:${last.col} closed by ${ch} at ${line}:${col}`);
      }
    }
  }
}
if(stack.length===0) console.log('All brackets matched');
else{
  console.log('Unclosed opens:');
  stack.forEach(x=>console.log(`${x.ch} opened at ${x.line}:${x.col}`));
}
