import { ICommand } from "@nestjs/cqrs";


export class DeleteBrandCommand implements ICommand {
    constructor(public readonly id: string) {}
}