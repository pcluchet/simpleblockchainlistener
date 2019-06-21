'use strict';

module.exports = {
    cc_invoke:
function (identity, request, channel, peerAddr, ordererAddr, peerListenerAddr) {

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var status = "";
var message = "";
var payload = "";
var ret = "";
var retur = "";

var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel(channel);
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);

var member_user = null;
var store_path = path.join(__dirname, '/hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
return Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {

	// assign the store to the fabric client
	fabric_client.setStateStore(state_store);
	var crypto_suite = Fabric_Client.newCryptoSuite();
	// use the same location for the state store (where the users' certificate are kept)
	// and the crypto store (where the users' keys are kept)
	var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

	// get the enrolled user from persistence, this user will sign all requests
	return fabric_client.getUserContext(identity, true);
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		//console.log(`Successfully loaded ${process.argv[2]} from persistence`);
		member_user = user_from_store;
	} else {
		//throw new Error(`Failed to get ${process.argv[2]}.... run registerUser.js`);
		status = 500;
		message = "user not found";
    }

		let txPromise = new Promise((resolve, reject) => {
			let handle = setTimeout(() => {
				event_hub.disconnect();
				resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
			}, 3000);
			event_hub.connect();
			event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
				// this is the callback for transaction event status
				// first some clean up of event listener
				clearTimeout(handle);
				event_hub.unregisterTxEvent(transaction_id_string);
				event_hub.disconnect();

				// now let the application know what happened
				var return_status = {event_status : code, tx_id : transaction_id_string};
				if (code !== 'VALID') {
					console.error('The transaction was invalid, code = ' + code);
					resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
				} else {
					//console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
					console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
					resolve(return_status);
				}
			}, (err) => {
				//this is the callback if something goes wrong with the event registration or processing
				reject(new Error('There was a problem with the eventhub ::'+err));
			});
		});
};