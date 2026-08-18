import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class InviteUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  @IsIn(["agente", "cliente"])
  role!: "agente" | "cliente";
}
