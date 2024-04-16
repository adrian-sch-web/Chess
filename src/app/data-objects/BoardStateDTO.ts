export class BoardStateDTO {
    state: string;
    occurences: number;

    constructor(state: string, occurences: number) {
        this.state = state;
        this.occurences = occurences;
    }
}