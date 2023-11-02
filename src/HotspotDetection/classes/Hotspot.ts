export class Hotspot {
    public constructor(
        // parsed fields
        public readonly fid: number,
        public readonly lineNum: number,
        public readonly hotness: 'YES' | 'NO' | 'MAYBE',
        public readonly avr: number,
        // complete JSON data
        public readonly pureJSONData: any
    ) {}
}
