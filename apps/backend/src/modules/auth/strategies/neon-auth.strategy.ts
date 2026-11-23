import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Dynamic import for ESM module
let jwksRsaModule: any;

async function loadJwksRsa() {
  if (!jwksRsaModule) {
    jwksRsaModule = await import('jwks-rsa');
  }
  return jwksRsaModule;
}

export interface NeonAuthPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  role?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

@Injectable()
export class NeonAuthStrategy extends PassportStrategy(Strategy, 'neon-auth') {
  private jwksClient: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {
    const jwksUrl = configService.get<string>('NEON_AUTH_JWKS_URL');
    const audience = configService.get<string>('NEON_AUTH_AUDIENCE', 'neondb');
    const issuer = configService.get<string>('NEON_AUTH_ISSUER');

    if (!jwksUrl) {
      throw new Error('NEON_AUTH_JWKS_URL is not configured');
    }

    // Initialize JWKS client before calling super
    const jwksClient = (async () => {
      const jwksRsa = await loadJwksRsa();
      return jwksRsa({
        jwksUri: jwksUrl,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000, // 10 minutes
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      });
    })();

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience,
      issuer,
      algorithms: ['RS256'],
      passReqToCallback: false,
      secretOrKeyProvider: async (
        request: unknown,
        rawJwtToken: string,
        done: (err: Error | null, key?: string | Buffer) => void
      ) => {
        const client = await jwksClient;
        // Extract kid from token header
        const header = JSON.parse(Buffer.from(rawJwtToken.split('.')[0], 'base64').toString());
        const kid = header.kid;

        if (!kid) {
          return done(new Error('No kid found in token header'));
        }

        client.getSigningKey(kid, (err: Error | null, key: any) => {
          if (err) {
            return done(err);
          }
          const signingKey = key?.getPublicKey();
          done(null, signingKey);
        });
      },
    };

    super(options);
    this.jwksClient = jwksClient;
  }

  async validate(payload: NeonAuthPayload): Promise<User> {
    // Try to find user by email from Neon Auth token
    const user = await this.userRepository.findOne({ 
      where: { email: payload.email } 
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado no sistema');
    }

    return user;
  }
}