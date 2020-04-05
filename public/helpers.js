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
