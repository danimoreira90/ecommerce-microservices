import { Controller, Get, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userRepository: UserRepository) {}

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: { sub: string }
  ): Promise<{ id: string; email: string; firstName: string; lastName: string; emailVerified: boolean }> {
    if (currentUser.sub !== userId) {
      throw new Error('Forbidden');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Not found');
    }
    return {
      id: user.id,
      email: user.email.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
    };
  }

  @Put(':userId/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('userId') userId: string,
    @Body() body: { firstName?: string; lastName?: string },
    @CurrentUser() currentUser: { sub: string }
  ): Promise<{ id: string; email: string; firstName: string; lastName: string }> {
    if (currentUser.sub !== userId) {
      throw new Error('Forbidden');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Not found');
    }
    user.updateProfile({ firstName: body.firstName, lastName: body.lastName });
    const updated = await this.userRepository.save(user);
    return {
      id: updated.id,
      email: updated.email.toString(),
      firstName: updated.firstName,
      lastName: updated.lastName,
    };
  }
}
