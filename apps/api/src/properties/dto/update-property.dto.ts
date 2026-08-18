import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsIn(["venta", "alquiler"])
  type?: "venta" | "alquiler";

  @IsOptional()
  @IsIn(["activa", "pausada", "vendida", "alquilada"])
  status?: "activa" | "pausada" | "vendida" | "alquilada";
}
