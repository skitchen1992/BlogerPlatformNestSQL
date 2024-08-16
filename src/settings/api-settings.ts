import { EnvironmentVariable } from '@settings/configuration';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class APISettings {
  constructor(private readonly envVariables: EnvironmentVariable) {}
  // Application
  @IsNumber()
  public readonly PORT: number = Number(this.envVariables.PORT);

  // Database
  @IsString()
  public readonly MONGO_CONNECTION_URI: string =
    this.envVariables.MONGO_CONNECTION_URI;

  //Admin login and pass
  @IsString()
  public readonly ADMIN_AUTH_USERNAME: string =
    this.envVariables.ADMIN_AUTH_USERNAME;
  @IsString()
  public readonly ADMIN_AUTH_PASSWORD: string =
    this.envVariables.ADMIN_AUTH_PASSWORD;

  //JWT
  @IsString()
  public readonly JWT_SECRET_KEY: string = this.envVariables.JWT_SECRET_KEY;
  @IsString()
  public readonly ACCESS_TOKEN_EXPIRED_IN: string =
    this.envVariables.ACCESS_TOKEN_EXPIRED_IN;
  @IsString()
  public readonly REFRESH_TOKEN_EXPIRED_IN: string =
    this.envVariables.REFRESH_TOKEN_EXPIRED_IN;

  //EMAIL
  @IsEmail()
  public readonly EMAIL_USER: string = this.envVariables.EMAIL_USER;
  @IsString()
  public readonly EMAIL_PASS: string = this.envVariables.EMAIL_PASS;

  //THROTTLER
  @IsString()
  public readonly THROTTLER_TTL: string = this.envVariables.THROTTLER_TTL;
  @IsString()
  public readonly THROTTLER_LIMIT: string = this.envVariables.THROTTLER_LIMIT;
}
