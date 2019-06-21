#!/usr/bin/env node

console.log("Hello World");


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
    let event_hub = channel.newChannelEventHub(peer);

});
