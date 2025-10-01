import { ICommand } from "@nestjs/cqrs";


export class UpdateBrandCommand implements ICommand {
    constructor(
        public readonly id: string,
        public readonly name?: string,
        public readonly active?: boolean,
    ) {}
}