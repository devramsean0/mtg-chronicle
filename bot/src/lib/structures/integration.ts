import { Piece } from '@sapphire/pieces';

export class Integration<Options extends Integration.Options = Integration.Options> extends Piece<Options, 'integrations'> {
    public readonly description: string;
    public readonly cronSchedule : string | null;
    public readonly gatedTo: string[] | null;

    public constructor(context: Integration.LoaderContext, options: Integration.Options = {description: 'Please Set me!'}) {
        super(context, options);
        this.description = options.description;
        this.cronSchedule = options.cronSchedule ?? null;
        this.gatedTo = options.gatedTo ?? null;
    }
    public fetchCards(_guildId: string, _auth: string) {}
}

export interface IntegrationOptions extends Piece.Options {
    description: string;
    cronSchedule?: string | null;
    gatedTo?: string[] | null;
}


export namespace Integration {
    export type Options = IntegrationOptions;
    export type LoaderContext = Piece.LoaderContext<'integrations'>;
}
