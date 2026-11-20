import { useGT, T } from "gt-react";
import { ChevronDownIcon } from "lucide-react";

import { updateClientSettings, useClientSettings } from "../../hooks/useSettings";
import { ThreadDetailsItemsMenuItems } from "../chat/ThreadDetailsItemsMenu";
import {
  isDefaultThreadDetailsVisibility,
  resolveThreadDetailsVisibility,
  RESET_THREAD_DETAILS_ITEMS,
  THREAD_DETAILS_ITEMS,
} from "../chat/threadDetailsItems";
import { Button } from "../ui/button";
import { Menu, MenuPopup, MenuTrigger } from "../ui/menu";
import { SettingResetButton, SettingsRow } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";

export function ThreadDetailsItemsRow() {
  const gt = useGT();
  const visibility = useClientSettings(resolveThreadDetailsVisibility);
  const enabled = THREAD_DETAILS_ITEMS.filter((item) => visibility[item.id]).length;
  return (
    <SettingsRow
      {...searchableSetting("thread-details-items")}
      description={gt(
        "Choose what the thread details card shows. You can also right-click the card.",
      )}
      resetAction={
        isDefaultThreadDetailsVisibility(visibility) ? null : (
          <SettingResetButton
            label={gt("thread details")}
            onClick={() => updateClientSettings(RESET_THREAD_DETAILS_ITEMS)}
          />
        )
      }
      control={
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between sm:w-40"
                aria-label={gt("Thread details: {value0} of {value1} on", {
                  value0: enabled,
                  value1: THREAD_DETAILS_ITEMS.length,
                })}
              />
            }
          >
            {enabled}
            <T> of </T>
            {THREAD_DETAILS_ITEMS.length}
            <T> on</T>
            <ChevronDownIcon aria-hidden />
          </MenuTrigger>
          <MenuPopup align="end">
            <ThreadDetailsItemsMenuItems />
          </MenuPopup>
        </Menu>
      }
    />
  );
}
