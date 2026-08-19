import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class InviteUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  // `cliente` ya no se puede invitar desde esta pantalla — los
  // clientes ahora navegan la página pública sin login (ver
  // 0003_public_properties.sql). El personal de la inmobiliaria se
  // separa en `agente` y `broker`, con los mismos permisos.
  @IsIn(["agente", "broker"])
  role!: "agente" | "broker";

  // Indicativo de país + número, solo dígitos (ej: "573001234567"),
  // mismo formato que usa wa.me (ver apps/web/lib/whatsapp.ts). Es el
  // número al que el bot va a escribirle cuando un cliente pregunte
  // por una propiedad de este agente/broker.
  @IsString()
  @Matches(/^\d{8,15}$/, {
    message: "phone debe ser un número con indicativo de país, solo dígitos (8 a 15)",
  })
  phone!: string;
}
