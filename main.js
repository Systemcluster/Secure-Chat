"use strict";

// convinience functions

function id(e) { return document.getElementById(e); }
function op(e) { console.log(e); }

var infoboxelem = document.createElement("div");
infoboxelem.style.display = "none";
infoboxelem.id = "infobox";
function infobox(message) {
    infoboxelem.style.display = "block";
    infoboxelem.innerHTML = message;
    document.body.appendChild(infoboxelem);
    infoboxelem.addEventListener("click", function(e) {
        infoboxelem.remove();
    });
}

// WebRTC

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
console.log(connection);
connection.onicecandidate = function(e) {
    if(e.candidate) {
        op(e);
    }
};
connection.onnegotiationneeded = function(e) {
    op(e);
};

var sendchannel = connection.createDataChannel("sendDataChannel", {
    ordered: true,
    protocol: "SCTP"
    //negotiated: true
    //id: something
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
    id("info-area").style.display = "none";
    id("chat-area").style.display = "block";
    id("connection-button-wrapper").style.opacity = 0;
    sendchannel.send("init");
};
sendchannel.onclose = function(e) {
    op(e);
};

function host(callback) {
    connection.createOffer(function(answer) {
        connection.setLocalDescription(answer, function() {
            callback(connection.localDescription);
        }, op);
    }, op);
}

function join(data, callback) {
    var description = new RTCSessionDescription(data);
    connection.setRemoteDescription(description, function() {
        connection.createAnswer(function(answer) {
            connection.setLocalDescription(answer, function() {
                callback(answer);
            }, op);
        }, op);
    });
}


// application logic

document.addEventListener("DOMContentLoaded", function(e) {

    var buttonwrapper = id("connection-button-wrapper");
    var buttonstart   = id("button-startsession");
    var buttonjoin    = id("button-joinsession");
    var infoarea      = id("info-area");
    var upperspacer   = id("upper-spacer");
    var introtext     = id("intro-text");
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
        introtext.innerHTML = "";
        buttonstart.disabled = true;
        buttonjoin.disabled = true;
        sitecontent.style.flexGrow = 0;

        try {
            host(function(description) {
                var hostarea = document.createElement("div");
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
                        var description = new RTCSessionDescription(JSON.parse(LZString.decompressFromBase64(input2.value.trim())));
                        connection.setRemoteDescription(description);
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

                    }
                    catch(e) {
                        op(e);
                        moreinfo.innerHTML = "Couldn't connect with the given connection key.";
                    }
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
        introtext.innerHTML = "";
        buttonstart.disabled = true;
        buttonjoin.disabled = true;
        sitecontent.style.flexGrow = 0;

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
                join(JSON.parse(LZString.decompressFromBase64(input.value.trim())), function(answer){
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
        infobox("<p>MANUAL HANDSHAKES ARE THE BEST HANDSHAKES, OK!?</p><p>No complaints accepted here.</p>");
    });

    if(window.location.hash) {
        if(window.location.hash === "#host") {
            id("button-startsession").click();
        }
        if(window.location.hash === "#join") {
            id("button-joinsession").click();
        }
    }
});
