import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestProfile } from "../guards/profile.guard";

export const CurrentProfile = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestProfile | null => {
    const req = ctx.switchToHttp().getRequest();
    return req.profile ?? null;
  },
);
