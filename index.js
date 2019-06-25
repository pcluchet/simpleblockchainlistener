#!/usr/bin/env node

const fs = require('fs');
var Fabric_Client = require('fabric-client');
var query = require('./query.js');
var path = require('path');
var util = require('util');
var os = require('os');
var status = "";
var message = "";
var payload = "";
var ret = "";
var retur = "";
var CHANNEL = "mhmd";
var CHAINCODE_ID = "mhmdcc";

//HOS CONFIG

var PEER_ADDR = "grpcs://185.34.140.215:7051/";
var IDENTITY = "athena_rc_hos";
let serverCert = fs.readFileSync(path.join(__dirname, 'certificates/hos.mhmd.com/tlsca/tlsca.hos.mhmd.com-cert.pem'));


var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel(CHANNEL);

//var peer = fabric_client.newPeer(PEER_ADDR);
var peer = fabric_client.newPeer(PEER_ADDR,
{
	'pem': Buffer.from(serverCert).toString(),
	'ssl-target-name-override': 'peer0.hos.mhmd.com'
}
);
channel.addPeer(peer);

async function eventify() {


	var promises = [];
	let eh = channel.newChannelEventHub(peer);

	let EventsPromise = new Promise((resolve, reject) => {
		let regid = null;
		regid = eh.registerChaincodeEvent(CHAINCODE_ID, 'createStudy',
			createStudyResponseCallback,
			eventHubProblemCallback
			//no options specified
			//startBlock will default to latest
			//endBlock will default to MAX
			//unregister will default to false
			//disconnect will default to false
		);

		eh.registerChaincodeEvent(CHAINCODE_ID, "updateStudy", updateStudyResponseCallback, eventHubProblemCallback);
		eh.registerChaincodeEvent(CHAINCODE_ID, "updateStudyResponse", updateStudyResponseCallback, eventHubProblemCallback);
		eh.registerChaincodeEvent(CHAINCODE_ID, "registerData", registerDataCallback, eventHubProblemCallback);
		eh.registerChaincodeEvent(CHAINCODE_ID, "registerResponse", registerResponseCallback, eventHubProblemCallback);
		eh.connect(true);
	});

	promises.push(EventsPromise);
	let results = await Promise.all(promises);

	console.log("Waiting for events...");
}
var member_user = null;
var store_path = path.join(__dirname, '/key_store');
//console.log('Store path:'+store_path);

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
return Fabric_Client.newDefaultKeyValueStore({
	path: store_path
}).then((state_store) => {
	// assign the store to the fabric client
	fabric_client.setStateStore(state_store);
	var crypto_suite = Fabric_Client.newCryptoSuite();
	// use the same location for the state store (where the users' certificate are kept)
	// and the crypto store (where the users' keys are kept)
	var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);
	// get the enrolled user from persistence, this user will sign all requests
	return fabric_client.getUserContext(IDENTITY, true);
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		console.log(`Successfully loaded identity from persistence`);
		member_user = user_from_store;
	} else {
		//throw new Error(`Failed to get ${process.argv[2]}.... run registerUser.js`);
		status = 500;
		message = "user not found";
	}

	//main loop
	console.log("Waiting for events...");
	eventify();

});

function registerResponseCallback(event, block_num, txnid, status) {
	console.log("Event happened, transaction ID :" + txnid + " Status:" + status);
	let event_payload = event.payload.toString();

	//Parsing payload of a Study response, expected format :
	//{"studyid":"Res_123456_1","studyname":"Studio1","status":"OK","encpar":"AES","hashes":"123456789ABCDEF","hashconf":"123456789ABCDEF","link":"http://localhost"}
	//Where studyid will follow the pattern Res_[STUDY ID]_[RESPONSE NUMBER]
	let event_payload_object = JSON.parse(event.payload.toString());

	console.log("Payload :" + event_payload);

	
	//Querying the blockchain to retreive the corresponding response
	var params = [event_payload_object.studyid];
	const request = {
		chaincodeId: CHAINCODE_ID,
		fcn: "query",
		args: params
	  };

	query.cc_query(request, channel).then(
		(result) => {
			console.log("Query result :" + result);
		}
	);
}

function eventHubProblemCallback(err) {
	console.log("There is a problem with the event hub : " + err);
	reject(err);
}

function createStudyResponseCallback(event, block_num, txnid, status) {
	console.log("Event happened, transaction ID :" + txnid + " Status:" + status);
	let event_payload = event.payload.toString();
	console.log("Payload :" + event_payload);
}

function updateStudyResponseCallback(event, block_num, txnid, status) {
	console.log("Event happened, transaction ID :" + txnid + " Status:" + status);
	let event_payload = event.payload.toString();
	console.log("Payload :" + event_payload);
}

function updateStudyResponseCallback(event, block_num, txnid, status) {
	console.log("Event happened, transaction ID :" + txnid + " Status:" + status);
	let event_payload = event.payload.toString();
	console.log("Payload :" + event_payload);
}

function registerDataCallback(event, block_num, txnid, status) {
	console.log("Event happened, transaction ID :" + txnid + " Status:" + status);
	let event_payload = event.payload.toString();
	console.log("Payload :" + event_payload);
}

