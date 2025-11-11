export function CancelAudio(type) {
    let synthesis = window.speechSynthesis;
    synthesis.cancel();
    if(type) {
            const textoElement = Array.from(
        document.getElementsByClassName(type)
    );
    textoElement.map(element => element.classList.remove("highlight"))
    }

}

export function CheckQueu() {
    let synthesis = window.speechSynthesis;
    return synthesis.pending;
}

export function Speak(utterance, lang) {
    let synthesis = window.speechSynthesis;
    utterance.lang = applyLanguage(lang);
    synthesis.speak(utterance);
}

function applyLanguage(language) {
    if (language == "es") {
        return "es-ES"
    }
    else if (language == "en") {
        return "en-US"
    } else {
        console.log("TODO falta el lenguaje")
    }
}