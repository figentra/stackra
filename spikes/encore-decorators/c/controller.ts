import { Container, Controller, Get, Inject, Injectable, Module } from "@spike/di";
@Injectable()
export class Repo { find(id: string) { return { id, name: "item-" + id }; } }
@Controller("items")
@Injectable()
export class ItemController {
  constructor(@Inject(Repo) private readonly repo: Repo) {}
  @Get("/c/items/:id")
  get({ id }: { id: string }): { id: string; name: string } { return this.repo.find(id); }
}
@Module({ providers: [Repo, ItemController], controllers: [ItemController] })
export class AppModule {}
export const container = Container.from(AppModule);
