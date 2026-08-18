import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  id: string;
  email: string | undefined;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest();
    return { id: req.userId, email: req.userEmail };
  },
);
