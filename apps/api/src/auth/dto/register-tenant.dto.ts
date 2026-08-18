import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tenantName!: string;
}
