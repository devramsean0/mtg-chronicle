import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';

export class UserRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, {
      ...options,
    });
  }

  public [methods.GET](_request: ApiRequest, response: ApiResponse) {
    response.json({ message: 'Online!' });
  }
}