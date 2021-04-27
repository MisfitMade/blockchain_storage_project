/**
 8 Zakery Clarke
 * CS 591
 * Compressing Blockchain using ledger accounting
 */
var fs=require("fs");


var blockchain=JSON.parse(fs.readFileSync("./blockchain.json"))

var ledger={};

var RESULTS=[["Block Index","Ledger Size (mb) K=0","Ledger Size (mb) K=100","Ledger Size (mb) K=200"," Ledger Size (mb) K=300","Ledger Size (mb) K=400","Ledger Size (mb) K=500","Blockchain Size (mb)","Number of Accounts","Number Transactions","Average Number of Transactions"]];


//Calcualte metrics for all blocks
for(var i=0;i<1000;i++){
  var block=blockchain[i];
  block.transactions.map(function(transaction){
    var from_address=transaction.inputs[0].prev_addresses[0];
    var to_address=transaction.outputs[0].addresses[0]
    var value=transaction.outputs[0].value
    //Record Transaction in Ledger

    if(ledger[to_address]){//Account exists
      ledger[to_address]+=value;
    }else{
      ledger[to_address]=value;
    }
    if(ledger[from_address]){//Account exists
      ledger[from_address]-=value;
    }else{
      ledger[from_address]=-1*value;
    }
  });

  var ledgerByteSize=[];
  //Calculate depending on different storage requirements of blocks
  for(var j=0;j<=500;j+=100){
    ledgerByteSize.push(calculateSizeLedger(i,ledger,j)/1000000)
  }
  var blockchainSize=calculateSizeBlockchain(i)/1000000;

  var acctSize=Object.keys(ledger).length;
  var tCount=transactionCounts(i);
  var numTransactions=tCount[0];
  var avgNumTransactionsPerBlock=tCount[1];


  RESULTS.push([i,ledgerByteSize[0],ledgerByteSize[1],ledgerByteSize[2],ledgerByteSize[3],ledgerByteSize[4],ledgerByteSize[5],blockchainSize,acctSize,numTransactions,avgNumTransactionsPerBlock])
  console.log(RESULTS[RESULTS.length-1])
}


var out="";
RESULTS.map(function(row){
  console.log(row);
  out+=row.join(",")+"\n";
})

fs.writeFileSync("analysis.csv", out);





/**
 * Size in bytes of reduced ledger format
 */
function calculateSizeLedger(block_index,ledger,numberBlocksToStore){
  if(block_index<numberBlocksToStore){//We dont have enough blocks to store yet
    return NaN;
  }
  var blocksToStore=[];
  for(var i=block_index;i>=block_index-numberBlocksToStore;i--){
    blocksToStore.push(blockchain[i]);
  }
  var size = (JSON.stringify(blocksToStore)+JSON.stringify(ledger)).length
  return size;
}

/**
 * Size in bytes of normal blockchain storage
 */
function calculateSizeBlockchain(block_index){
  var blocksToStore=[];
  for(var i=0;i<block_index;i++){
    blocksToStore.push(blockchain[i]);
  }
  var size = (JSON.stringify(blocksToStore)).length
  return size;
}

/**
 * Number of transactions and avergae number of transactions per block
 */

 function transactionCounts(block_index){
   numberTranscations=0;
   for(var i=0;i<block_index;i++){
     var block=blockchain[i];
     numberTranscations+=block.transactions.length;

   }

   avgNumTransactions=numberTranscations/block_index;
   return [numberTranscations,avgNumTransactions]
 }
