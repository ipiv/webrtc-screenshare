# Peer to peer screenshare and chat
For rough WIP  check out - [git.io/WebRTC](https://git.io/WebRTC)
1. Click on **Create** a room and copy the provided **ID**
2. Open a new tab or from other pc click **Join** and paste the **ID** from previous step
3. Connection is now **p2p** and no server is intercepting your messages or any data in that sense.
4. Messagebox allows to send messages to other connected peer
5. To start **Screenshare** either:
    - Click on the **client ID** in the "Currently in room" list on the right
    - Or **"Click to share your screen"** button on the left
6. You can specifiy a specific **application/window/tab** to share
7. Optionally you can check **"Share Audio"** to also include your desktop audio

#
**Note: Please setup your own Signalhub or other signalling service**

<br/>
Screensharing is based on Mediadevices API, more on this API:  
https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices

More on WebRTC (Web Real-Time Communication):  
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

Using [simple-peer](https://github.com/feross/simple-peer) for peer handling and [signalhub](https://github.com/mafintosh/signalhub) for signalling negotiations

In order for Screenshare ( Mediadevices API ) to work properly, your  
server needs to have SSL enabled (e.g self-signed certificates for localhost) - 

or alternatively you can provide flags on chrome launch:  
https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins
