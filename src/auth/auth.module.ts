//src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CustomerModule } from 'src/customer/customer.module';
import { OwnerModule } from 'src/owner/owner.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CustomerJwtStrategy } from './customer.jwt.strategy';
import { OwnerJwtStrategy } from './owner.jwt.strategy';
import { JwtConfigService } from '../config/jwt.config.service';
import { OwnerLoginService } from 'src/owner/service/owner.login.service';
import { CustomerLoginService } from 'src/customer/service/customer.login.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    CustomerModule,
    OwnerModule,
  ],
  controllers: [],
  providers: [CustomerJwtStrategy, OwnerJwtStrategy, JwtConfigService, OwnerLoginService, CustomerLoginService],
})
export class AuthModule {}
