# Peer to peer screenshare and chat
### Peer to peer chat and screenshare utilizing WebRTC

Screenshare is based on Mediadevices API, more on this API:  
https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices

More on WebRTC (Web Real-Time Communication):  
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

Uses [simple-peer](https://github.com/feross/simple-peer) for WebRTC connection and [signalhub](https://github.com/mafintosh/signalhub) for signalling negotiations

In order for Screenshare ( Mediadevices API ) to work properly, your  
server needs to have SSL enabled (e.g self-signed certificates for localhost) - 

or alternatively you can provide flags on chrome:  
https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins