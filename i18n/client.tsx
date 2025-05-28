import { I18nBoth, LangCode } from "./both";

export interface I18nClient {
    swChecking: string;
    updatingAtStart: string;
    updateNow: (fromVersion: string, toVersion: string) => string;
}

export type I18nClientArg = LangCode & I18nBoth & I18nClient;
