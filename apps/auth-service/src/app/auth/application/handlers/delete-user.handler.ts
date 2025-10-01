import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { DeleteUserCommand } from "../commands/user.commands";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserCacheService } from "../services/user-cache.service";

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler
  implements ICommandHandler<DeleteUserCommand, Auth.DeleteUserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: DeleteUserCommand): Promise<Auth.DeleteUserResponse> {
    const { id } = command;

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.delete(id);
    await this.userCacheService.invalidate(user);

    return {
      success: true,
    };
  }
}