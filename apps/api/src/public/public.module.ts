import { Module } from "@nestjs/common";
import { PropertiesModule } from "../properties/properties.module";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";

@Module({
  imports: [PropertiesModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
