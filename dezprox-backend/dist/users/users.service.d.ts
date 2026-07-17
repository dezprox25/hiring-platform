import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
export declare class UsersService implements OnModuleInit {
    private readonly usersRepository;
    private readonly configService;
    private readonly logger;
    constructor(usersRepository: Repository<User>, configService: ConfigService);
    onModuleInit(): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateRefreshToken(userId: string, hashedToken: string | null): Promise<void>;
    create(userData: Partial<User>): Promise<User>;
}
