const swarm = require('webrtc-swarm')
const signalhub = require('signalhub')
const Peer = require('simple-peer')

const hub = signalhub('sharescreen', ['https://signalhubb.herokuapp.com/'])

const createRoom = async () => {
  console.log('Creating new channel...')
  const roomId = randomId()
  const identifier = randomId()
  await joinHub(roomId, identifier, true)
  createRoomInfoEl(roomId)
  // const peer = await initPeer(roomId, true)
}

const createRoomInfoEl = (roomId) => {
  const roomInfoEl = document.createElement('div')
  const infoH2 = document.createElement('h2')
  const infoP = document.createElement('h2')
  infoH2.textContent = 'Your Room ID is:'
  infoP.textContent = roomId
  roomInfoEl.append(infoH2)
  roomInfoEl.append(infoP)
  document.getElementById('connect-wrapper').prepend(roomInfoEl)
  document.getElementById('join-room-container').hidden = true
  document.getElementById('start-buttons').hidden = true
}

const joinHub = async (roomId, id, initiator = false) => {
  hub.subscribe(roomId)
    .on('data', async (data) => {
      if (data.action == 'joined') {
        const messageEl = document.createElement('li')
        if (data.from == id) {
          data.from += ' (You)'
        }
        messageEl.textContent = data.from+' - Just joined'
        document.getElementById('messages').appendChild(messageEl)
        
      } else if (data.action == 'getConnected') {
        hub.broadcast(roomId, {from: id, action:'connected'})

      } else if (data.action == 'connected') {
        const chattersEl = document.getElementById('chatters')
        const hasChatter = chattersEl.querySelector('#chatter-'+data.from) != null;
        if(!hasChatter) {
          const newChatter = document.createElement('li')
          newChatter.setAttribute('id', 'chatter-'+data.from)
          newChatter.textContent = data.from == id ? data.from+'(You)' : data.from
          if (data.from !== id) newChatter.addEventListener('click', startScreenshare)
          chattersEl.append(newChatter)
        }
      } else if (data.action == 'startScreenShare') {
        if (data.from !== id) {
          const peer = await initializeScreenShare(true)
          hub.peer = peer
        }
      } else if (data.action == 'signal') {
        if (data.from !== id) {
          console.log('Got signalling data, sending to peer')
          hub.peer.signal(data.signalData)
        }
      }
    })
  hub.broadcast(roomId, {from: id, action:'joined'}, () => getConnected(roomId, id))
  hub.roomId = roomId
  hub.identifier = id
  return
}
const getConnected = (roomId, id) => {
  hub.broadcast(roomId, {from: id, action:'getConnected'})
}
const joinRoomById = async () => {
  const roomId = document.getElementById('room-id-input').value
  const identifier = randomId()
  await joinHub(roomId, identifier)
  createRoomInfoEl(roomId)
  getConnected(roomId, identifier)
}

const showJoinContainer = () => {
  document.getElementById('join-room-container').hidden = false
}

const startScreenshare = async() => {
  const peer = await initializeScreenShare()
  hub.peer = peer
  hub.broadcast(hub.roomId, {from: hub.identifier, action:'startScreenShare'})
}

const initializeScreenShare = async (initiator = false) => {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
  if (!stream) return new Error('Failed to get stream')
  const peer = new Peer({ initiator, stream })
  peer.on('signal', data => {
    hub.broadcast(hub.roomId, {from: hub.identifier, action:'signal', signalData: data})
  })
  peer.on('connect', () => {
    console.log('Peer is connected')
    const sendMessageButton = document.getElementById('chat-send-button')
    const messageBox = document.getElementById('chat-messagebox')
    sendMessageButton.parentNode.hidden = false
    const sendMessage = () => {
      const message = hub.identifier+': '+messageBox.value
      peer.send(message)
      const newMessage = document.createElement('li')
      newMessage.textContent = 'You: '+messageBox.value
      document.getElementById('messages').append(newMessage)
      messageBox.value = ''
      const messagesWrapper = document.getElementById('chat-messages-wrapper')
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }
    sendMessageButton.addEventListener('click', sendMessage)
    messageBox.addEventListener('keyup', (e)=> {
      if (e.which == 13 || e.keyCode == 13) {
        sendMessage()
    }
    })
    // peer.send('Hey from datachannel')
  })
  peer.on('data', data => {
    // got a data channel message
    const newMessage = document.createElement('li')
    newMessage.textContent = data
    const messagesEl = document.getElementById('messages')
    
    messagesEl.append(newMessage)
    const messagesWrapper = document.getElementById('chat-messages-wrapper')
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
  })
  peer.on('close', () => {
    console.log('Peer is closed')
  })
  peer.on('error', (err) => {
    console.log('Peer error', err)
  })
  peer.on('stream', stream => {
    const videoWrapper = document.getElementById('video-wrapper') || document.createElement('div')
    videoWrapper.setAttribute('id', 'video-wrapper')
    const videoEl = document.querySelector('video') || document.createElement('video')
    if ('srcObject' in videoEl) {
      videoEl.srcObject = stream
    } else {
      videoEl.src = window.URL.createObjectURL(stream) // for older browsers
    }
    videoWrapper.append(videoEl)
    const connectionWrapper = document.getElementById('connect-wrapper').parentNode
    connectionWrapper.hidden = true
    connectionWrapper.parentNode.append(videoWrapper)
    videoEl.play()
  })
  return peer
}

const randomId = (length = 6) => {
  return Math.round((Math.random() * 36 ** length)).toString(36)
}

const main = () => {
  const joinButton = document.getElementById('show-join-room')
  joinButton.addEventListener('click', showJoinContainer)

  const submitRoomButton = document.getElementById('submit-room-id')
  submitRoomButton.addEventListener('click', joinRoomById)

  const createButton = document.getElementById('create-room')
  createButton.addEventListener('click', createRoom)
}
main()



// const initPeer = async (roomId, initiator = false) => {
//   const peer = await initializeScreenShare(initiator)

//   hub.subscribe(roomId)
//     .on('data', (data) => {
//       console.log('hub | ondata',data)
//       if(data.from !== peer.identifier) {
//         console.log('hub | ondata - not from me')
//       }
//       // peer.signal(data)
//     })
  
//   peer.on('signal', (data) => {
//     const id = peer.identifier
//     console.log('peer | onsignal',data)
//     hub.broadcast(roomId, {from:peer.identifier, signal:data})
//   })

//   return peer
// }



// hub.subscribe('my-channel')
//   .on('data', function (message) {
//     console.log('new message received', message)
//   })

// hub.broadcast('my-channel', {hello: 'world'})

// const sw = swarm(hub)

// sw.on('peer', function (peer, id) {
//     console.log('connected to a new peer:', id)
//     peer.on('data', data    )
//     console.log('total peers:', sw.peers.length)
// })

// sw.on('disconnect', function (peer, id) {
//     console.log('disconnected from a peer:', id)
//     console.log('total peers:', sw.peers.length)
// })
