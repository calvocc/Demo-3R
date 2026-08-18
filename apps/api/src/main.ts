import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody: true — el webhook de WhatsApp necesita los bytes exactos
  // que envió Meta para poder validar la firma X-Hub-Signature-256.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const corsOrigin = config.get<string>("CORS_ORIGIN", "http://localhost:3000");
  app.enableCors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  });

  const port = config.get<number>("PORT", 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`3R Connect CRM API escuchando en el puerto ${port}`);
}

bootstrap();
