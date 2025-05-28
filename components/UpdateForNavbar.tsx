import { versionToString } from "../../pr-lib-sw-utils/sw-utils";
import SpinningButton from "../../pr-lib-utils/client/components/SpinningButton";
import { UpdateForNavbarProps } from "../hooks/useSw";
import { I18nClientArg } from "../i18n/client";

export default function UpdateForNavbar({
    l,
    swChecking,
    updatingAtStart,
    updateAvailable,
    updateSpinning,
    onUpdateNow,
    className,
}: UpdateForNavbarProps & {
    className?: string;
    l: I18nClientArg;
}) {

    return <div className={className}>
        {
            swChecking && <p style={{ fontSize: 'small' }}>
                {l.swChecking}
            </p>
        }
        {
            updatingAtStart && <p style={{ fontSize: 'small'}}>
                {l.updatingAtStart}
            </p>
        }
        {
            updateAvailable &&
            <SpinningButton primary spinning={updateSpinning} onClick={onUpdateNow}>
                {l.updateNow(versionToString(updateAvailable.client), versionToString(updateAvailable.server))}
            </SpinningButton>
        }
    </div>

}