"use strict";

function id(e) { return document.getElementById(e); }
function op(e) { console.log(e); }


var infobox = function(message) {
    if(infobox.infoboxelem === undefined) {
        infobox.infoboxelem = document.createElement("div");
        infobox.infoboxelem.style.display = "none";
        infobox.infoboxelem.id = "infobox";
    }
    infobox.infoboxelem.style.display = "block";
    infobox.infoboxelem.innerHTML = message;
    document.body.appendChild(infobox.infoboxelem);
    infobox.infoboxelem.addEventListener("click", function(e) {
        infobox.infoboxelem.remove();
    });
};

var configuration = {
    iceServers: [
        // default google ice servers
        {url: "stun:stun.l.google.com:19302"},
        {url: "stun:stun1.l.google.com:19302"},
        {url: "stun:stun2.l.google.com:19302"},
        {url: "stun:stun3.l.google.com:19302"},
        {url: "stun:stun4.l.google.com:19302"}
    ]
};
var connection = new RTCPeerConnection(configuration);
connection.onicecandidate = function(e) {
    if(e.candidate) { // still gathering candidates here...
    }
    else { // candidates gathered
    }
};
connection.onnegotiationneeded = function(e) {
    // nothing to negotiate
    op(e);
};
connection.onstatechange = function(e) {
    op(e);
}

var sendchannel = connection.createDataChannel("sendDataChannel", {
    ordered: true,
    protocol: "SCTP"
});
sendchannel.onerror = function(e) {
    op(e);
};
sendchannel.onmessage = function(e) {
    op("message received");
    op(e);
    op(e.data);
};
sendchannel.onopen = function(e) {
    op(e);
    id("chat-log").innerHTML = "Success! "+JSON.stringify(e);
    sendchannel.send("init");
};
sendchannel.onclose = function(e) {
    op(e);
};

function host(callback) {
    connection.createOffer(function(answer) {
        op(answer);
        connection.setLocalDescription(answer, function() {
            op(connection);
            callback(connection.localDescription);
        }, op);
    }, op);
} // function host

function join(data, callback) {
    op({"join called": data});
    var description = new RTCSessionDescription(data);
    op({"description object": description});

    connection.setRemoteDescription(description, function() {
        op("remote description set");
        connection.createAnswer(function(answer) {
            op({"created answer": answer});
            connection.setLocalDescription(answer, function() {
                callback(answer);
            }, op);
        }, op);
    }, op);

} // function join

function init() {

    var buttonwrapper = id("connection-button-wrapper");
    var buttonstart   = id("button-startsession");
    var buttonjoin    = id("button-joinsession");
    var introtext     = id("intro-text");
    var infoarea      = id("info-area");
    var sitecontent   = id("site-content");

    function showerror(message) {
        var span = document.createElement("span");
        span.classList.add("error");
        span.id = "error-message";
        span.innerHTML = message;
        infoarea.innerHTML = "";
        infoarea.appendChild(span);
    }

    // button: create a session
    buttonstart.onclick = function(e) {
        buttonstart.disabled = true;
        buttonjoin.disabled = true;
        introtext.remove();

        try {
            host(function(description) {
                var hostarea = document.createElement("div");
                hostarea.classList.add("info-area");
                var info1 = document.createElement("div");
                info1.innerHTML = "Share your connection key below. <em>(Improved usability options are planned.)</em>";
                hostarea.appendChild(info1);
                var input1 = document.createElement("textarea");
                input1.setAttribute("readonly", "readonly");
                input1.onfocus = function(e) {input1.select();};
                hostarea.appendChild(input1);
                var info2 = document.createElement("div");
                info2.innerHTML = "Enter the counterpart key below. <em>(Improved usability options are planned.)</em>";
                hostarea.appendChild(info2);
                var moreinfo = document.createElement("div");
                moreinfo.classList.add("important");
                var input2 = document.createElement("textarea");
                input2.addEventListener("input", function(e) {
                    moreinfo.innerHTML = "";
                    try {
                        var description = new RTCSessionDescription(JSON.parse(LZString.decompressFromBase64(input2.value)));
                    }
                    catch(e) {
                        op(e);
                        op("Couldn't connect with the given connection key.");
                    }
                    op(description);
                    connection.setRemoteDescription(description, function() {
                        // Connection successful!
                        input2.setAttribute("readonly", "readonly");
                        var wrap = document.createElement("div");
                        var spinner = document.createElement("div");
                        spinner.classList.add("spinner");
                        var bounce1 = document.createElement("div");
                        bounce1.classList.add("double-bounce1");
                        var bounce2 = document.createElement("div");
                        bounce2.classList.add("double-bounce2");
                        spinner.appendChild(bounce1);
                        spinner.appendChild(bounce2);
                        wrap.appendChild(spinner);
                        infoarea.appendChild(wrap);
                    }, function(e) {
                        op(e);
                        op("Couldn't connect with the given connection key.");
                    });
                });
                hostarea.appendChild(input2);
                hostarea.appendChild(moreinfo);
                infoarea.appendChild(hostarea);

                console.log(description);
                input1.innerHTML = LZString.compressToBase64(JSON.stringify(description));
            });
        }
        catch(e) {
            op(e);
            showerror(e);
        }
    }

    // button: join a session
    buttonjoin.onclick = function(e) {
        buttonstart.disabled = true;
        buttonjoin.disabled = true;
        introtext.remove();

        var joinarea = document.createElement("div");
        joinarea.style.display = "none";
        var info1 = document.createElement("div");
        info1.innerHTML = "Enter your connection key below. <em>(Improved usability options are planned.)</em>";
        joinarea.appendChild(info1);
        var moreinfo = document.createElement("div");
        moreinfo.classList.add("important");

        var info = document.createElement("div");
        info.innerHTML = "Share your counterpart key below. <em>(Improved usability options are planned.)</em>";
        var input2 = document.createElement("textarea");
        input2.setAttribute("readonly", "readonly");
        input2.onfocus = function(e) {input2.select();};

        var input = document.createElement("textarea");
        input.classList.add("connection-key-input");
        joinarea.appendChild(input);
        joinarea.appendChild(moreinfo);
        input.addEventListener("input", function(e) {
            moreinfo.innerHTML = "";
            info.remove();
            input2.remove();
            try {
                join(JSON.parse(LZString.decompressFromBase64(input.value)), function(answer){
                    op(answer);
                    input2.innerHTML = LZString.compressToBase64(JSON.stringify(answer));
                });
                joinarea.appendChild(info);
                joinarea.appendChild(input2);
            } catch(e) {
                op(e);
                moreinfo.innerHTML = "Couldn't connect with the given connection key.";
            }
        });
        infoarea.appendChild(joinarea);
        joinarea.style.display = "block";
    };
    
    id("complain-text").addEventListener("click", function(e) {
        infobox("<p>MANUAL HANDSHAKES ARE THE BEST HANDSHAKES.</p><p>No complaints here.</p>");
    });

    if(window.location.hash) {
        if(window.location.hash === "#host") {
            id("button-startsession").click();
        }
        if(window.location.hash === "#join") {
            id("button-joinsession").click();
        }
    }

} // function init


if(document.readyState === "loading") 
    document.addEventListener("DOMContentLoaded", init);
else init();

