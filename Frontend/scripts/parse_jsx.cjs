try{
  const fs = require('fs');
  const parser = require('@babel/parser');
  const src = fs.readFileSync('D:/Thenuga/MauvalPrint/Frontend/src/Products/SingleProductView.jsx','utf8');
  const ast = parser.parse(src,{sourceType:'module',plugins:['jsx','classProperties','optionalChaining']});
  console.log('Parsed OK');
}catch(e){
  console.error('Parse error:');
  console.error(e.message);
  if(e.loc) console.error('At',e.loc);
}
