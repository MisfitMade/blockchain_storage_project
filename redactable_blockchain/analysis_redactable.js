/**
 * Trey Sampson
 * CS 591
 * Redactable Blockchain Compression
 * Adapted from Zakery Clarke's Ledger Blockchain Compression
 */

var fs=require("fs");

var blockchain=JSON.parse(fs.readFileSync("./blockchain.json"))

var RESULTS=[["Block Index", "Blockchain Size Before Redaction", "Blockchain Size After Tx Redaction", "Blockchain Size After Out Redaction", "Deletable Tx", "Deletable Out", "Redactable Transactions", "Remaining Tx"]];

//Global Variables
var blockChainSizeBefore = 0;
var blockChainSizeAfterTx = 0;
var blockChainSizeAfterOut = 0;
var deletableTxBytes = [];
var deletableOutBytes = [];

//Iterate through all blocks determining amount of redactable data
for(var i = 0; i < 1000; i++){
    var block = blockchain[i];
    deletableTxBytes[i] = 0;
    deletableOutBytes[i] = 0;
    var blockSize = JSON.stringify(block).length;
    blockChainSizeBefore += blockSize;
    blockChainSizeAfterTx += blockSize;
    blockChainSizeAfterOut += blockSize;
    var redactableTx = 0;
    for(var j = 0; j < block.transactions.length; j++) {
        var numOutputs = block.transactions[j].outputs.length;
        var redactableOut = 0;
        for (var k = 0; k < numOutputs; k++) {
            if (block.transactions[j].outputs[k].spent_by_tx_position != -1) { //spent tx - can delete
                deletableOutBytes[i] += JSON.stringify(block.transactions[j].outputs[k]).length;
                redactableOut += 1;
            }
            if(redactableOut == numOutputs){
                deletableTxBytes[i] += JSON.stringify(block.transactions[j]).length;
                redactableTx++;
            }
        }
    }
    if(i > 5){
        blockChainSizeAfterTx -= deletableTxBytes[i-6];
        blockChainSizeAfterOut -= deletableOutBytes[i-6];
    }
    var remainingTx = block.transactions.length - redactableTx;
    RESULTS.push([i, blockChainSizeBefore, blockChainSizeAfterTx, blockChainSizeAfterOut, deletableTxBytes[i], deletableOutBytes[i], redactableTx, remainingTx])
    console.log(RESULTS[RESULTS.length-1])
}

var out="";
RESULTS.map(function(row){
    console.log(row);
    out+=row.join(",")+"\n";
})

fs.writeFileSync("analysis.csv", out);