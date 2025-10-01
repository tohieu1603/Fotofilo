
import * as bcryptjs from 'bcryptjs';

export class Password {
    private constructor(
        private readonly hashPassword: string,
        private readonly plainPassword?: string
    ){}

    static async create(plainPassword: string): Promise<Password> {
        if(!Password.isValid(plainPassword)) {
            throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
        }
        const hashPassword = await bcryptjs.hash(plainPassword, 10);
        return new Password(hashPassword, plainPassword);
    }

    static fromHash(hashedPassword: string): Password {
        return new Password(hashedPassword);
    }

    static isValid(password: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    async comparePassword(plainPassword: string): Promise<boolean> {
        return bcryptjs.compare(plainPassword, this.hashPassword);
    }

    getHashValue(): string {
        return this.hashPassword;
    }

    equals(other: Password): boolean {
        return this.hashPassword === other.hashPassword;
    }
}