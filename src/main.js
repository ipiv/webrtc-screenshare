const signalhub = require('signalhub')
const Peer = require('simple-peer')
const hub = signalhub('RTChub', ['https://signalhubb.herokuapp.com/'])

const monitorIcon = require('./icons/monitor')
const recordIcon = require('./icons/record')

const createRoom = async () => {
  console.log('Creating new channel...')
  const roomId = randomId()
  const identifier = randomId()
  await joinHub(roomId, identifier, true)
  createRoomInfoEl(roomId)
}

const createRoomInfoEl = roomId => {
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
  hub.roomId = roomId
  hub.identifier = id
  hub.initiator = initiator
  hub.subscribe(roomId).on('data', async data => {
    switch (data.action) {
      case 'joined':
        addChattersEl(data.from)
        const messageEl = document.createElement('li')
        messageEl.textContent += `${data.from}${data.from == id ? ' (You)' : ''} - Just joined`
        document.getElementById('messages').appendChild(messageEl)
        if (!hub.initiator) return
        if (!hub.peer) {
          const peer = await initializePeer()
          hub.peer = peer
          hub.broadcast(roomId, {
            from: id,
            action: 'startConnection'
          })
        } else {
          hub.broadcast(roomId, {
            from: id,
            action: 'startConnection'
          })
        }
        break
      case 'getConnected':
        hub.broadcast(roomId, {
          from: id,
          action: 'connected'
        })
        break
      case 'signal':
        if (data.from === id) return
        console.log('Got signalling data, sending to peer')
        hub.peer.signal(data.signalData)
        break
      case 'startConnection':
        if (data.from === hub.identifier) return
        addChattersEl(data.from)
        hub.peer = await initializePeer(true)
        console.log('got startConnection request, peer ready')
        break
      default:
        break
    }
  })
  hub.broadcast(
    roomId,
    {
      from: id,
      action: 'joined'
    },
    () => {}
  )
  return
}

const addChattersEl = chatterId => {
  const chattersEl = document.getElementById('chatters')
  const hasChatter = chattersEl.querySelector('#chatter-' + chatterId) != null
  if (!hasChatter) {
    const newChatter = document.createElement('li')
    newChatter.setAttribute('id', 'chatter-' + chatterId)
    newChatter.classList += 'client'
    newChatter.textContent = chatterId == hub.identifier ? chatterId + '(You)' : chatterId
    if (chatterId !== hub.identifier) {
      newChatter.addEventListener('click', startScreenshare)
      document.getElementById('connect-wrapper').appendChild(createScreenShareElement())
    } else {
      newChatter.className += ' client__self'
    }
    chattersEl.append(newChatter)
  }
}

const createScreenShareElement = () => {
  const screenShareEl = document.createElement('div')
  screenShareEl.setAttribute('id', 'screenshare-wrapper')
  screenShareEl.appendChild(monitorIcon)
  const shareTextEl = document.createElement('span')
  shareTextEl.textContent = ' Click to share your screen'
  screenShareEl.appendChild(shareTextEl)
  screenShareEl.addEventListener('click', startScreenshare)

  return screenShareEl
}

const createShareStatusElement = () => {
  const statusEl = document.createElement('div')
  statusEl.setAttribute('id', 'share-status')
  statusEl.append(recordIcon)
  statusEl.append(document.createTextNode('You are sharing your screen!'))

  return statusEl
}

const getConnected = (roomId, id) => {
  hub.roomId = roomId
  hub.identifier = id
  hub.broadcast(roomId, {
    from: id,
    action: 'getConnected'
  })
}

const joinRoomById = async () => {
  const roomId = document.getElementById('room-id-input').value
  if (!roomId) return
  const identifier = randomId()
  await joinHub(roomId, identifier)
  createRoomInfoEl(roomId)
}

const showJoinContainer = () => {
  document.getElementById('join-room-container').hidden = false
}

const startConnection = async () => {
  const peer = await initializePeer()
  hub.peer = peer
  hub.broadcast(hub.roomId, {
    from: hub.identifier,
    action: 'startConnection'
  })
}

const startScreenshare = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })
    if (!stream) throw new Error('Failed to get stream. is SSL configured?')

    let statusEl = document.getElementById('share-status')
    if (!statusEl) {
      statusEl = createShareStatusElement()
      document.getElementById('left-wrapper').prepend(statusEl)
    } else {
      statusEl.classList.remove('hidden')
    }
    const screenShareEl = document.getElementById('screenshare-wrapper')
    screenShareEl.classList.add('hidden')

    stream.getVideoTracks()[0].onended = event => {
      statusEl.classList.add('hidden')
      screenShareEl.classList.remove('hidden')
    }
    hub.peer.addStream(stream)
  } catch (err) {
    console.error(err)
  }
}

const initializePeer = async (initiator = false) => {
  const peer = new Peer({
    initiator: initiator
  })
  peer.on('signal', data => {
    hub.broadcast(hub.roomId, {
      from: hub.identifier,
      action: 'signal',
      signalData: data
    })
  })
  peer.on('connect', () => {
    console.log('Peer is connected')
    const sendMessageButton = document.getElementById('chat-send-button')
    const messageBox = document.getElementById('chat-messagebox')
    sendMessageButton.parentNode.hidden = false
    const sendMessage = () => {
      if (!messageBox.value) return
      const message = hub.identifier + ': ' + messageBox.value
      peer.send(message)
      const newMessage = document.createElement('li')
      newMessage.textContent = 'You: ' + messageBox.value
      document.getElementById('messages').append(newMessage)
      messageBox.value = ''
      const messagesWrapper = document.getElementById('chat-messages-wrapper')
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight
    }
    sendMessageButton.addEventListener('click', sendMessage)
    messageBox.addEventListener('keydown', e => {
      if (e.which == 13 || e.keyCode == 13) {
        e.preventDefault()
        sendMessage()
      }
    })
  })
  peer.on('data', data => {
    const newMessage = document.createElement('li')
    newMessage.textContent = data
    const messagesEl = document.getElementById('messages')

    messagesEl.append(newMessage)
    const messagesWrapper = document.getElementById('chat-messages-wrapper')
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight
  })
  peer.on('close', () => {
    console.log('Peer is closed')
  })
  peer.on('error', err => {
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
    videoEl.controls = true
    videoWrapper.append(videoEl)
    const connectionWrapper = document.getElementById('connect-wrapper').parentNode
    connectionWrapper.hidden = true
    connectionWrapper.parentNode.append(videoWrapper)
    videoEl.play()
  })
  return peer
}

const randomId = (length = 6) => {
  return Math.round(Math.random() * 36 ** length).toString(36)
}

const main = () => {
  const joinButton = document.getElementById('show-join-room')
  joinButton.addEventListener('click', showJoinContainer)

  const submitRoomButton = document.getElementById('submit-room-id')
  submitRoomButton.addEventListener('click', joinRoomById)

  const roomInputEl = document.getElementById('room-id-input')
  roomInputEl.addEventListener('keydown', e => {
    if (e.which == 13 || e.keyCode == 13) {
      e.preventDefault()
      joinRoomById()
    }
  })

  const createButton = document.getElementById('create-room')
  createButton.addEventListener('click', createRoom)
}
main()
