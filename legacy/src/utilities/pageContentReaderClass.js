export class ContentReader {
    constructor(palabra) {
        this.utterance = new SpeechSynthesisUtterance(palabra);
    }
}
