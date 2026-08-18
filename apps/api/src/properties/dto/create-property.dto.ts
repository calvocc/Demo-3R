import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsIn(["venta", "alquiler"])
  type!: "venta" | "alquiler";
}
