import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  useApi,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  DatePicker,
  useAttributes,
  useAppMetafields,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const attributes = useAttributes();
  const updateAttributes = useApplyAttributeChange();
  const desiredDeliveryDate = attributes?.find(
    (attribute: { key: string }) => attribute.key === "Delivery Date",
  )?.value;

  useEffect(() => {
    if (!desiredDeliveryDate) {
      const value = new Date().toLocaleDateString("en-CA");
      updateAttributes({
        type: "updateAttribute",
        key: "Delivery Date",
        value,
      });
    }
  }, []);

  function getDisabledDates(
    dateSelection: any,
  ): Array<string | { start: string; end: string }> {
    const disabled: Array<string | { start: string; end: string }> = [];
    if (dateSelection?.selectionType === "date_range") {
      if (dateSelection.dateRangeStart && dateSelection.dateRangeEnd) {
        disabled.push({
          start: dateSelection.dateRangeStart,
          end: dateSelection.dateRangeEnd,
        });
      }
    } else if (dateSelection?.selectionType === "specific_day") {
      if (dateSelection.sun) disabled.push("Sunday");
      if (dateSelection.mon) disabled.push("Monday");
      if (dateSelection.tue) disabled.push("Tuesday");
      if (dateSelection.wed) disabled.push("Wednesday");
      if (dateSelection.thu) disabled.push("Thursday");
      if (dateSelection.fri) disabled.push("Friday");
      if (dateSelection.sat) disabled.push("Saturday");
    } else {
      if (dateSelection.specifyDates) disabled.push(dateSelection.specifyDates);
    }

    return disabled;
  }

  const appMetafields = useAppMetafields();
  const methodSetting =
    appMetafields.find(
      (appMetafield) => appMetafield.metafield.key == "devesha",
    )?.metafield || [];
  // Parse the JSON with type safety
  const valueJson: any[] | Record<string, any> =
    methodSetting && "value" in (methodSetting as Record<string, any>)
      ? JSON.parse((methodSetting as Record<string, any>).value)
      : {};

  return (
    <DatePicker
      selected={desiredDeliveryDate || new Date().toLocaleDateString("en-CA")}
      onChange={(value: string) => {
        if (!value) return;
        updateAttributes({
          type: "updateAttribute",
          key: "Delivery Date",
          value,
        });
      }}
      disabled={getDisabledDates(valueJson)}
    />
  );
}
