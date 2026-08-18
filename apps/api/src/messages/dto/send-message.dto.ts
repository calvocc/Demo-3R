import { IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength } from "class-validator";

export class SendMessageDto {
  // Formato E.164, ej. +573001234567 (sin espacios)
  @IsString()
  @IsPhoneNumber(undefined, { message: "El número debe estar en formato internacional, ej. +573001234567" })
  to!: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;
}
