import { enClientArg as utilsClientArg } from "../../../pr-lib-utils/i18n/en/client";
import { I18nClient, I18nClientArg } from "../client";
import { enBoth } from "./both";

export const enClient: I18nClient = {
    swChecking: 'Checking if new version available ...',
    updatingAtStart: 'Loading new version ...',
    updateNow: (fromVersion, toVersion) => `Update now from ${fromVersion} to ${toVersion}`,
}

export const enClientArg: I18nClientArg = {
    ...enBoth,
    ...enClient,
    ...utilsClientArg,
    langCode: 'en',
}

export const libSwClientEn = enClientArg;
export const libSwClient = libSwClientEn;
