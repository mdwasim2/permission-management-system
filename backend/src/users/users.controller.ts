import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { SetUserPermissionsDto } from './dto/set-user-permissions.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Req() request: Request) {
    return this.usersService.getUsers(request);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto, @Req() request: Request) {
    return this.usersService.createUser(createUserDto, request);
  }

  @Patch(':id')
  updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateUser(userId, updateUserDto, request);
  }

  @Post(':id/suspend')
  suspendUser(@Param('id') userId: string, @Req() request: Request) {
    return this.usersService.suspendUser(userId, request);
  }

  @Post(':id/ban')
  banUser(@Param('id') userId: string, @Req() request: Request) {
    return this.usersService.banUser(userId, request);
  }

  @Patch(':id/permissions')
  setUserPermissions(
    @Param('id') userId: string,
    @Body() setUserPermissionsDto: SetUserPermissionsDto,
    @Req() request: Request,
  ) {
    return this.usersService.setUserPermissions(userId, setUserPermissionsDto, request);
  }
}
