"use strict";

var id = i => document.getElementById(i);
var op = e => console.log(e);

var configuration = {
    iceServers: [
        {url: "stun:stun.l.google.com:19302"},
        {url: "stun:stun1.l.google.com:19302"},
        {url: "stun:stun2.l.google.com:19302"},
        {url: "stun:stun3.l.google.com:19302"},
        {url: "stun:stun4.l.google.com:19302"}
    ]
};

var connection;
var sendchannel;
connection = new RTCPeerConnection();
sendchannel = connection.createDataChannel("sendchannel");
sendchannel.onopen = e => op("I have connected! This is the best!");
sendchannel.onclose = e => op("I have lost a connection to " +e );
sendchannel.onmessage = e => op("I have received a message! "+e );

var remote;
var receivechannel;
remote = new RTCPeerConnection();
remote.ondatachannel = e => { 
    receivechannel = e.channel;
    receivechannel.onopen = e => op("receiveopen " + e);
    receivechannel.onclose = e => op("receiveclose " + e);
    receivechannel.onmessage = e => op("receivemessage " + e);
};


connection.onicecandidate = e => !e.candidate
    || remote.addIceCandidate(e.candidate)
    .catch(op);
remote.onicecandidate = e => !e.candidate
    || connection.addIceCandidate(e.candidate)
    .catch(op);

connection.createOffer()
    .then(offer => connection.setLocalDescription(offer))
    .then(() => remote.setRemoteDescription(connection.localDescription))
    .then(() => remote.createAnswer())
    .then(answer => remote.setLocalDescription(answer))
    .then(() => connection.setRemoteDescription(remote.localDescription))
    .catch(op);


var initialize = () => {

};
if(document.readyState === "loading") 
    document.addEventListener("DOMContentLoaded", initialize);
else initialize();
