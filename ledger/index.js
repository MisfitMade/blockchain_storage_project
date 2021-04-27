const fetch = require('node-fetch');
var fs=require("fs");
//https://chain.api.btc.com/v3/block/673611/tx?verbose=1

var BLOCKS=[];

var amount=1000;

var start=670000+amount;
var stop=start-amount;

var current=start;

fetchBlock();

/**
 * Fetch block and write to file
 */
async function fetchBlock(){
  var id=current;
  console.log(id);
  try{
    var data=await (fetch(`https://chain.api.btc.com/v3/block/${id}/tx?verbose=1`)
  .then(res => res.json()).catch(x=>console.log(x)))
  await timeout(5000)
  var blockData=await (fetch(`https://chain.api.btc.com/v3/block/${id}`)
  .then(res => res.json()).catch(x=>console.log(x)))
  var block={
    hash:blockData.data.hash,
    merkle_root:blockData.data.mrkl_root,
    nonce:blockData.data.nonce,
    timestamp:blockData.data.timestamp,
    previous_block_hash:blockData.data.prev_block_hash,
    difficulty:blockData.data.difficulty,
    height:blockData.data.height,
    transactions:[]
  };
  // data.data.list.map(function(x){
  //   block.hash=x.block_hash
  //   block.transactions.push({
  //     inputs:x.inputs.map((y)=>{return {
  //         addresses:y.prev_addresses,
  //         prev_hash:y.prev_tx_hash,
  //     }}),
  //     outputs:x.inputs.map((y)=>{return {
  //         addresses:y.prev_addresses,
  //         prev_hash:y.prev_tx_hash,
  //     }})



  //   })
  // })

  data.data.list.map(function(x){
    block.hash=x.block_hash
    block.transactions.push({
      inputs:x.inputs,
      outputs:x.outputs
    })
  })

 BLOCKS.unshift(block);
 current--;
  if(id>stop){
    setTimeout(fetchBlock,5000);
  }else{
    fs.writeFileSync('blockchain.json', JSON.stringify(BLOCKS));
  }
  }catch(e){
    //Probably Rate Limited, wait a bit
    setTimeout(fetchBlock,50000);

  }



}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep(fn, ...args) {
    await timeout(3000);
    return fn(...args);
}
