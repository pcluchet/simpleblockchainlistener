const request = require('request')
 
class MyEventHub {
    constructor(eventHub) {
        // Stores processed transaction ids
        this.transactions = {}
        this.currentBlock = null
        this.channel = eventHub._channel
        eventHub.registerBlockEvent(this.handleBlockEvent.bind(this), this.onErrorBlock)
    }
 
    // Sets up listner for transaction ids
    // Success = success callback -> passes in result to success
    // err = error callback -> run if we have an error?
    // transactionid = transaction Id - string(?)
    registerTxEvent(transactionId, success, err) {
        if (this.transactions[transactionId.toString()]) {
            // We already have the transaction processed, so run success callback
            return success()
            // but what about the payload?
        }
 
        this.transactions[transactionId.toString()] = {success, err, callback: true}
    }
 
    onErrorBlock(error) {
        console.log('Blockevent listener encountered an error :/')
        console.error(error)
    }
    // wrappre around processBlock
    async handleBlockEvent(block) {
        let blockNumber = block.header.number
        // See if we've missed out any blocks
        if (this.currentBlock && this.currentBlock < blockNumber - 1) {
            // We've missed some blocks. need to go and fetch them all
            // set block incase we receive another one while processing older blocks
            let missingBlockNumber = this.currentBlock
            this.currentBlock = blockNumber
            console.log('missed blocks, going back to fetch some :)')
            while (missingBlockNumber < blockNumber-1) {
                let block = await this.channel.queryBlock(missingBlockNumber)
                this.processBlock(block)
            }
        } else {
            this.currentBlock = blockNumber
        }
 
        this.processBlock(block)
    }
 

    processBlock(block) {
        // loop through transactions and see what we can do here
        for (let transaction of block.data.data) {
            let header = transaction.payload.header; // the "header" object contains metadata of the transaction
            let tx_id = header.channel_header.tx_id
            let actions = transaction.payload.data.actions
            for (let action of actions) {
                let prp = action.payload.action.proposal_response_payload
                let {chaincode_id, events, response} = prp.extension
                let listener = this.transactions[tx_id]
                if (listener) {
                    if (response.status > 300) {
                        console.log('we have recieved a strange status')
                        listener.success(response, 'WIERD')
                    } else {
                        listener.success(response, 'VALID')
                    }
                } else {
                    this.transactions[tx_id] = {response, callback: false}
                }
            }
        }
 
        let id = block.header.data_hash
        request.put({
            url: `${url}/${db}/${id}`,
            body: block,
            json: true
        }, function(err, resp, body) {
            console.log(err, resp, body)
        })
    }
}
 
module.exports = MyEventHub
