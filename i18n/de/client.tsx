import { I18nClient, I18nClientArg } from "../client";
import { deBoth } from "./both";

export const deClient: I18nClient = {
    swChecking: "Prüfe, ob neue Version verfügbar ...",
    updatingAtStart: 'Lade neue Version ...',
    updateNow: (fromVersion, toVersion) => `Jetzt updaten von ${fromVersion} zu ${toVersion}`,
}

export const deClientArg: I18nClientArg = {
    ...deBoth,
    ...deClient,
    langCode: 'de',
}

export const libSwClientDe = deClientArg;
export const libSwClient = libSwClientDe;
