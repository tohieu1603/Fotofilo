export class Email {
    private constructor(private readonly value: string) {
        if(!Email.isValid(value)) {
            throw new Error('Invalid email format');
        }
    }
    static create(value: string): Email {
        return new Email(value);
    }
    static isValid(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }
    getValue(): string {
        return this.value;
    }
}