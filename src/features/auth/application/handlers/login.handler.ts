import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '@features/users/infrastructure/users.repository';
import { UnauthorizedException } from '@nestjs/common';
import {
  LoginOutputDto,
  LoginOutputDtoMapper,
} from '@features/auth/api/dto/output/login.output.dto';
import { CookieService } from '@infrastructure/servises/cookie/cookie.service';
import { getUniqueId } from '@utils/utils';
import { COOKIE_KEY } from '@utils/consts';
import { Response, Request } from 'express';
import { SharedService } from '@infrastructure/servises/shared/shared.service';
import { SessionsRepository } from '@features/session/infrastructure/sessions.repository';
import { getCurrentISOStringDate } from '@utils/dates';
import { Session } from '@features/session/domain/session.entity';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '@settings/configuration';
export class LoginCommand {
  constructor(
    public loginOrEmail: string,
    public password: string,
    public res: Response,
    public req: Request,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginHandler
  implements ICommandHandler<LoginCommand, LoginOutputDto>
{
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly sharedService: SharedService,
    private readonly cookieService: CookieService,
    private readonly configService: ConfigService<ConfigurationType, true>,
  ) {}
  async execute(command: LoginCommand): Promise<LoginOutputDto> {
    const { loginOrEmail, password, res, req } = command;

    const { user } = await this.usersRepository.getUserByLoginOrEmail(
      loginOrEmail,
      loginOrEmail,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    const isCorrectPass = await this.sharedService.isCorrectPass(
      password,
      user.password,
    );

    if (!isCorrectPass) {
      throw new UnauthorizedException();
    }

    const deviceId = getUniqueId();
    const userId = user._id.toString();
    const apiSettings = this.configService.get('apiSettings', { infer: true });

    const refreshToken = await this.sharedService.getRefreshToken(
      userId,
      deviceId,
      { expiresIn: apiSettings.REFRESH_TOKEN_EXPIRED_IN },
    );

    const userAgentHeader = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip || 'unknown';

    const newSession: Session = {
      userId,
      ip: ipAddress,
      title: userAgentHeader,
      lastActiveDate: getCurrentISOStringDate(),
      tokenIssueDate: getCurrentISOStringDate(),
      tokenExpirationDate:
        this.sharedService.getTokenExpirationDate(refreshToken),
      deviceId,
    };

    await this.sessionsRepository.create(newSession);

    this.cookieService.setCookie(res, COOKIE_KEY.REFRESH_TOKEN, refreshToken);

    return LoginOutputDtoMapper(
      await this.sharedService.getAccessToken(userId),
    );
  }
}
