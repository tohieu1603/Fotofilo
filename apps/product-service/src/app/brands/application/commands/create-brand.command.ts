import { ICommand } from "@nestjs/cqrs";


export class CreateBrandCommand implements ICommand {
    constructor(
        public readonly name: string,
        public readonly active = true,
    ) {}
}