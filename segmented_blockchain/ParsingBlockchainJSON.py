# Measuring blockchain.json data
import json
import csv

def computeBytesInAHeader(block, bytesInBlock):
    #now a header is bytes in block - bytes in all transactions
    return bytesInBlock - len(json.dumps(block['transactions']))

#computes the bytes in a block
def computeBytesInABlock(block):
    return len(json.dumps(block))

#returns unspent transactions number of bytes
def computeStateBytesInABlock(block):

    '''I want to sum the list of spent_by_txs in this block's transactions

    Below gives me a list of lists: { [out1,out2,...], [out1,out2,...]... }'''
    outputBlocks = list(map(lambda ins_outs: ins_outs['outputs'], list(map(lambda tx: tx, block['transactions']))))
    #now for each inner list, find txs that are unspent
    unspentTxBytes = 0
    for i in range(len(outputBlocks)):
        outputBlock = outputBlocks[i]
        #traverse each inner list
        for j in range(len(outputBlock)):
            if(outputBlock[j]['spent_by_tx'] == ""):
                unspentTxBytes = unspentTxBytes + len(json.dumps(outputBlock[j]))   
    #now I have unspentTxBytes, which is all the output transaction bytes for output transactions which are unspent
    return unspentTxBytes


#computes the average storage assignemnt of a full node depnding on the C, length of chain, nodes in network and segment size
def computeStorageAssignment(totalHeaderBytes, totalBlockchainBytes, totalState, C, nodes_in_network):
    '''length of typical segment is segment_length = int((C * length_of_chain) / nodes_in_network)
    Which means, number of segments is s = int(length_of_chain/segment_length)
    Thus, number of segments is int(nodes_in_network / C), as the int function rounds down

    now I have to compute the bytes per each segment of segment_length starting at block 0 through the last block in
    segment number_of_segments - 1 + the bytes in the final segment that holds the remainder blocks, then add that all up. 
    Well, this is just totalBlockchainBytes. So, totalBlockchainBytes / number of segments gives an average of how many 
    segment bytes a node stores.

    Then add bytes used to store wallet states to that, then add totalHeaderBytes too, and that is the average storage assignment
    in bytes for a fulll node in Segmented Blockchain method. Divide that by 1000000 to get Mbs'''
    return (totalBlockchainBytes / int(nodes_in_network / C) + totalHeaderBytes + totalState) / 1000000


def main():
    #import the blockchain.json
    with open('blockchain.json') as jsonFile:
        blockchain = json.load(jsonFile)
    '''now I have the json as blockchain. 
    What I want to do is create a .csv file having Mbs that a full node would have to store 
    on the y axis vs number of blocks on the x axis. 
    One set of points would be the normal blockchain. Other sets would be
    whole_chain_as_headers + average of (state_derived_from_segment_i-1 + segment_i) for all i
    with varying segment sizes. 

    length_of_segment = [C * (length_of_chain)] / nodes_in_network 
    where C is the "redundancy constant" (coined myself, not in paper), meaning it is the number
    of nodes you want storing identical segments. If C = 1, then every node in the 
    network stores a unique segment. If C = 2 then every segment is stored at 2 nodes
    in the network. Etc. Ideally, a network would not want to have a C equal to one 
    because this would mean if a single node leaves the network, then its segment is
    lost. This means there are 
    [ s = length_of_chain / length_of_segment ] number of segments. 
    length_of_segment is not typically a round number and so segment_0, segment_1, ..., segment_s-1
    are all of length length_of_segment while segment_s is 
    [ length_of_segment + [C * (length_of_chain)] % nodes_in_network ].
    
    bytes of block headers starting at blockchain 0 and grows as our length_of_chain increases. 
    Same for bytes in chain bytes needed to store all the unspent transactions for whatever length the chain is'''
    totalHeaderBytes = 0
    totalBlockchainBytes = 0
    totalState = 0
    #For storing the results and moving into a the .csv file
    RESULTS = [["Block Index", "Storage Assignment (Mb) C = 1", "Storage Assignment (Mb) C = 2", "Storage Assignment (Mb) C = 3",
                "Storage Assignment (Mb) C = 4", "Storage Assignment (Mb) C = 5", "Blockchain size (Mb)"]]

    '''Going to start computing graph points once there are 14 blocks (explained below), so til then, just accumulate Block Index, 
    totalBlockchainBytes and 0s'''
    for i in range(13):
        block = blockchain[i]
        #add on the number of chars in the block = number of bytes
        bytesInThisBlock = computeBytesInABlock(block)
        totalBlockchainBytes = totalBlockchainBytes + bytesInThisBlock
        #add number of chars in block header
        totalHeaderBytes = totalHeaderBytes + computeBytesInAHeader(block, bytesInThisBlock)
        #add up the bytes for the unspent transactions
        totalState = totalState + computeStateBytesInABlock(block)
        RESULTS.append([i, 0, 0, 0, 0, 0, totalBlockchainBytes/1000000])

    ''' now we are at block 14 out of 1000, so lets start computing storage assignments. Per https://bitnodes.io/
    there is approximately 9485 full nodes reported 04/07/2021, aka nodes that would have storage assignments. Since we are using 
    1000 out of approximately 678,264 blocks per https://bitinfocharts.com/bitcoin/ reported 04/07/2021, that is 0.0014743522 of
    the blockchain; thus, I will use 0.0014743522 * 9485 = 13.98 = 14 as nodes_in_network for the computations
    
    Note:
    This means that C = 1, 2, 3, 4, 5 in a 14 full node network, 
    is proportional to C = 677.5, 1355.0, 2032.5, 2710.0, 3387.5 in a 9485 full node network, respectively.
    This means that in our data model,
    C = 1 means each segment is stored at 07.14% of nodes
    C = 2 means each segment is stored at 14.29% of nodes
    C = 3 means each segment is stored at 21.43% of nodes
    C = 4 means each segment is stored at 28.57% of nodes
    C = 5 means each segment is stored at 35.71% of nodes'''

    nodes_in_network = 14
    for i in range(13, len(blockchain)):
        block = blockchain[i]
        #add on the number of chars in the block = number of bytes
        bytesInThisBlock = computeBytesInABlock(block)
        totalBlockchainBytes = totalBlockchainBytes + bytesInThisBlock
        #add number of chars in block header
        totalHeaderBytes = totalHeaderBytes + computeBytesInAHeader(block, bytesInThisBlock)
        #add up the bytes for the unspent transactions
        totalState = totalState + computeStateBytesInABlock(block)

        '''now we compute 6 storage assignment values. It will have to be an average as each node would in reality
        store slightly different Mbs because a segment's blocks can differ in Mbs. 
        
        Also, recall that C is the number of nodes that store identical segments. When C = 1, then every segment stores a unique segment.'''
        length_of_chain = i+1
        RESULTS.append(     [i, 
                            computeStorageAssignment(totalHeaderBytes, totalBlockchainBytes, totalState, 1, nodes_in_network), 
                            computeStorageAssignment(totalHeaderBytes, totalBlockchainBytes, totalState, 2, nodes_in_network),
                            computeStorageAssignment(totalHeaderBytes, totalBlockchainBytes, totalState, 3, nodes_in_network),
                            computeStorageAssignment(totalHeaderBytes, totalBlockchainBytes, totalState, 4, nodes_in_network),
                            computeStorageAssignment(totalHeaderBytes, totalBlockchainBytes, totalState, 5, nodes_in_network),
                            totalBlockchainBytes/1000000])

    #Now I have RESULTS full of data. Output it to a .csv
    with open('storage_assignments.csv', 'w') as storage_file:
        rowWriter = csv.writer(storage_file)
        rowWriter.writerows(RESULTS)

if __name__ == "__main__":
    main()
