(() => {
    "use strict";

    var id = i => document.getElementById(i);

    var showmessage = (message, author, time) => {
        var chatobj, chathdr, chatmsg;
        chatobj = document.createElement("div");
        chatobj.classList.add("chat-message");

        chathdr = document.createElement("div");
        chathdr.classList.add("chat-message-header");

        chatmsg = document.createElement("p");
        chatmsg.classList.add("chat-message-content");

        chatmsg.innerHTML = message;
        chathdr.innerHTML = author;
        
        chatobj.appendChild(chathdr);
        chatobj.appendChild(chatmsg);
        id("chat-log").appendChild(chatobj);
    };

    var connectioncallback = () => {};
    var datachannel;
    var datachannelsetup = channel => {
        channel.onopen = e => {
            console.info("connection opened", e);
        }
        channel.onclose = e => console.info("connection closed", e);
        channel.onerror = e => console.error("connection error", e);
        channel.onmessage = e => {
            console.info("message received", e);
            showmessage(e.data, "A very tsundere person");
        }
    }

    var initchat = () => {
        id("info-area").remove();
        id("connection-button-wrapper").innerHTML = "";
        var input = document.createElement("textarea");
        input.setAttribute("placeholder", "Better say nothing here...");
        id("connection-button-wrapper").appendChild(input);
        var button = document.createElement("button");
        button.classList.add("connection-button");
        button.innerHTML = "Send anyway";
        id("connection-button-wrapper").appendChild(button);
        button.onclick = () => {
            showmessage(input.value, "Kouhei")
            datachannel.send(input.value);
        }
        input.value = "";
    };

    var iceserverlist = [
        {url: "stun:stun.l.google.com:19302"},
        {url: "stun:stun1.l.google.com:19302"},
        {url: "stun:stun2.l.google.com:19302"},
        {url: "stun:stun3.l.google.com:19302"},
        {url: "stun:stun4.l.google.com:19302"}
    ];
    var connectionoptions = [
        {DtlsSrtpKeyAgreement: true}
    ];
    var connection = new RTCPeerConnection({iceServers: iceserverlist}, {optional: connectionoptions});
    connection.onicecandidate = e => e.candidate || connectioncallback();
    connection.ondatachannel = e => {
        datachannel = e.channel;
        datachannelsetup(datachannel);
        console.info("setup channel", datachannel);
        initchat();
    }

    var host = () => {
        id("intro-text").remove();
        id("button-startsession").remove();
        id("button-joinsession").remove();
        id("connection-button-wrapper").innerHTML = "<p>...</p>";
        //id("connection-button-wrapper").style.backgroundImage = "url(https://media.giphy.com/media/YLob3fr2syys/giphy.gif)";

        var datachanneloptions = {
            ordered: true,
            protocol: "SCTP"
        };
        datachannel = connection.createDataChannel("datachannel", datachanneloptions);
        datachannelsetup(datachannel);

        connectioncallback = () => {
            var description = document.createElement("p");
            description.innerHTML = "<span>You... you want someone to join? Join me...? (⌯˃̶᷄ ﹏ ˂̶᷄⌯)</span><br><span>Share your invitation key below, I guess...</span>";
            id("info-area").appendChild(description);

            var offerarea = document.createElement("textarea");
            offerarea.setAttribute("readonly", "readonly");
            offerarea.onfocus = e => offerarea.select();
            offerarea.value = LZString.compressToEncodedURIComponent(JSON.stringify(connection.localDescription));
            id("info-area").appendChild(offerarea);

            var answerarea = document.createElement("textarea");
            answerarea.setAttribute("placeholder", "Enter your counterpart key here, if you want.");
            id("info-area").appendChild(answerarea);

            var response = document.createElement("p");
            id("info-area").appendChild(response);

            answerarea.addEventListener("input", e => {
                var key;
                try {
                    key = JSON.parse(LZString.decompressFromEncodedURIComponent(answerarea.value));
                    console.info("entered key", key);
                }
                catch(e){
                    console.error(e);
                }
                if(!key || key.type !== "answer") {
                    response.innerHTML = "This is no answer key... (;•͈́༚•͈̀)";
                    return;
                }
                answerarea.disabled = true;
                response.innerHTML = "Trying to build up a connection... (´；Д；｀)";//◦°˚\\(*❛‿❛)/˚°◦";
                
                connection.setRemoteDescription(new RTCSessionDescription(key))
                .then(() => {
                    console.info("working connection established!");
                    initchat();
                })
                .catch(() => {
                    response.value = "Oh no... something went wrong! ( ´•̥̥̥ω•̥̥̥` )";
                });
            });
        }

        connection.createOffer()
            .then(offer => connection.setLocalDescription(offer))
            .catch(e => console.error(e));
    };

    var join = () => {
        id("intro-text").remove();
        id("button-startsession").remove();
        id("button-joinsession").remove();
        id("connection-button-wrapper").innerHTML = "<p>...</p>";
        //id("connection-button-wrapper").style.backgroundImage = "url(https://media.giphy.com/media/NjDEkK1Wl5eM/giphy.gif)";

        var description = document.createElement("p");
        description.innerHTML = "Insert your invitation key below to join someone! ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽";
        id("info-area").appendChild(description);

        var offerarea = document.createElement("textarea");
        var response = document.createElement("p");
        offerarea.addEventListener("input", e => {
            var key;
            try {
                key = JSON.parse(LZString.decompressFromEncodedURIComponent(offerarea.value));
                console.info("entered key", key);
            }
            catch(e){
                console.error(e);
            }
            if(!key || key.type !== "offer") {
                response.innerHTML = "This is no offer key... (;•͈́༚•͈̀)";
                return;
            }
            offerarea.disabled = true;
            response.innerHTML = "Share your answer key below to accept the invitation! ヾ(≧∇≦*)ゝ";

            var responsearea = document.createElement("textarea");
            id("info-area").appendChild(responsearea);
            responsearea.setAttribute("readonly", "readonly");
            responsearea.onfocus = e => responsearea.select();

            connection.setRemoteDescription(new RTCSessionDescription(key))
            .then(() => connection.createAnswer())
            .then(answer => connection.setLocalDescription(answer))
            .then(() => {
                responsearea.value = LZString.compressToEncodedURIComponent(JSON.stringify(connection.localDescription));
            })
            .catch(() => {
                responsearea.value = "Oh no... something went wrong! ( ´•̥̥̥ω•̥̥̥` )";
            });

        });
        id("info-area").appendChild(offerarea);
        id("info-area").appendChild(response);
    }


    var initialize = () => {
        id("button-startsession").addEventListener("click", host);
        id("button-joinsession").addEventListener("click", join);

        if(window.location.hash) {
            if(window.location.hash === "#host") {
                id("button-startsession").click();
            }
            if(window.location.hash === "#join") {
                id("button-joinsession").click();
            }
        }
    };
    if(document.readyState === "loading") 
        document.addEventListener("DOMContentLoaded", initialize);
    else initialize(); 

})();
