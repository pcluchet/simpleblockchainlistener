'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


module.exports = {
    cc_query:
        function (request, channel) {

            var path = require('path');
            var util = require('util');
            var os = require('os');

            var status = "200";
            var message = "";
            var response = "";
            var ret = "";

            return channel.queryByChaincode(request).then((query_responses) => {
                //console.log("Query has completed, checking results");
                // query_responses could have more than one  results if there multiple peers were used as targets
                //console.log(query_responses[0].response.status);
                if (query_responses && query_responses.length == 1) {
                    if (query_responses[0] instanceof Error) {
                        status = "500";
                        message = query_responses[0];

                        //			console.error("error from query = ", query_responses[0]);
                    } else {
                        //console.log(util.format( '{status : %s response : "%s" }', status, query_responses[0].toString()));
                        response = query_responses[0].toString();
                    }
                } else {
                    //console.log("No payloads were returned from query");

                    status = "500";
                    message = "no payload returned from query";

                }
            }).catch((err) => {
                status = "500";
                message = err;

                //console.error('Failed to query successfully :: ' + err);
            }).then(() => {
                var msg = "";
                if (message.message)
                    msg = message.message;
                if (isJson(response)) {
                    ret = util.format('{"status" : "%s", "response" : %s, "message" : %s }', status, response, JSON.stringify(msg));
                }
                else {
                    ret = util.format('{"status" : "%s", "response" : %s, "message" : %s }', status, JSON.stringify(response), JSON.stringify(msg));
                }
                return ret;
            });
        }
};
