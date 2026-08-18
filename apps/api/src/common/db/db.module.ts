import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { PG_POOL, RlsQueryService } from "./rls-query.service";

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>("DATABASE_URL"),
          // El pooler de Supabase en modo "Transaction" (puerto 6543)
          // termina TLS con un certificado de una CA que node no trae
          // por defecto; para una demo, rejectUnauthorized:false es
          // aceptable (documentar como pendiente para producción).
          ssl: { rejectUnauthorized: false },
          max: 10,
        }),
    },
    RlsQueryService,
  ],
  exports: [RlsQueryService],
})
export class DbModule {}
