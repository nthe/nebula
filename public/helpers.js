function attachFilterTypeSwitch(synth) {
    const filterType = window.document.createElement('p')
    let selectedFilterIndex = 0
    filterType.onclick = () => {
        selectedFilterIndex =
            (selectedFilterIndex + 1) % synth.filterTypes.length
        synth.filterType = synth.filterTypes[selectedFilterIndex]
        filterType.innerHTML = synth.filterTypes[selectedFilterIndex]
    }
    filterType.classList.add('filterType')
    filterType.innerHTML = 'lowpass'
    return filterType
}

const SAMPLES = ['Chair', 'Door', 'Glass', 'Metal', 'Radio']

function loadAudioSamples(container, onClicked) {
    for (let sample of SAMPLES) {
        const li = document.createElement('li')
        li.innerHTML = sample
        container.appendChild(li)
    }

    // attach listener to sample click
    container.addEventListener('click', (event) => {
        const sample = `./assets/audio/samples/${event.target.innerHTML}.wav`
        for (let el of container.children) {
            if (el.classList.contains('active')) {
                el.classList.toggle('active')
            }
        }
        event.target.classList.toggle('active')
        onClicked(sample)
    })
}

const AUDIO_IRS = [
    'Bat Cave',
    'Church',
    'MicroVerb',
    'RE301',
    'Steinman Hall',
    'Waterfront Park',
]

function loadImpulseResponses(container, onClicked) {
    for (let sample of AUDIO_IRS) {
        const li = document.createElement('li')
        li.innerHTML = sample
        container.appendChild(li)
    }

    // attach listener to sample click
    container.addEventListener('click', (event) => {
        const sample = `./assets/audio/impulses/${event.target.innerHTML}.wav`
        for (let el of container.children) {
            if (el.classList.contains('active')) {
                el.classList.toggle('active')
            }
        }
        event.target.classList.toggle('active')
        onClicked(sample)
    })
}

function attachRecordingService(context, synth) {
    const dest = context.createMediaStreamDestination()
    const mediaRecorder = new MediaRecorder(dest.stream)
    synth.master.connect(dest)
    setTimeout(() => {
        dest.connect(context.destination)
    }, 1000)

    const record = document.querySelector('.record-button')
    let recording = false

    record.onclick = function () {
        console.log('clicked')
        if (!recording) {
            mediaRecorder.start()
            record.style.fill = 'red'
        } else {
            mediaRecorder.stop()
            record.style.fill = 'gray'
        }
        recording = !recording
    }

    const chunks = []

    mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data)
    }

    mediaRecorder.onstop = function (e) {
        var blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' })
        var audioURL = window.URL.createObjectURL(blob)
        var anchor = document.createElement('a')
        anchor.href = audioURL
        anchor.download = `nubula-audio-recording.webm`
        anchor.click()
    }
}
