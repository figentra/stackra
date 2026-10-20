import { Container, Inject, Injectable, Module } from "@spike/di";
const CLOCK = "CLOCK";
@Injectable()
export class Clock { now() { return "t0"; } }
@Injectable()
export class Greeter {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}
  hi(name: string) { return `hi ${name} @${this.clock.now()}`; }
}
@Module({ providers: [Greeter, Clock] })
export class AppModule {}
export const container = Container.from(AppModule);
(container as any).providers.set(CLOCK, Clock);
