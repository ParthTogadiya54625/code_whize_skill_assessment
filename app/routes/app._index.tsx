import { useCallback, useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  ChoiceList,
  DatePicker,
  BlockStack,
  Text,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  let dateSelection = await prisma.dateSelection.findUnique({
    where: { relationSettingId: session.id },
  });

  if (!dateSelection) {
    dateSelection = await prisma.dateSelection.create({
      data: {
        selectionType: "specific_date",
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
        relationSettingId: session.id,
      },
    });
  }
  return { dateSelection };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const selectionType = formData.get("selectionType") as string;
  const specificDate = formData.get("specificDate") as string;
  const dateRangeStart = formData.get("dateRangeStart") as string;
  const dateRangeEnd = formData.get("dateRangeEnd") as string;
  const sun = formData.get("sun") === "on";
  const mon = formData.get("mon") === "on";
  const tue = formData.get("tue") === "on";
  const wed = formData.get("wed") === "on";
  const thu = formData.get("thu") === "on";
  const fri = formData.get("fri") === "on";
  const sat = formData.get("sat") === "on";

  const dbDateSelection = await prisma.dateSelection.upsert({
    where: { relationSettingId: session.id },
    update: {
      selectionType,
      specifyDates: specificDate || null,
      dateRangeStart: dateRangeStart || null,
      dateRangeEnd: dateRangeEnd || null,
      sun,
      mon,
      tue,
      wed,
      thu,
      fri,
      sat,
    },
    create: {
      selectionType,
      specifyDates: specificDate || null,
      dateRangeStart: dateRangeStart || null,
      dateRangeEnd: dateRangeEnd || null,
      sun,
      mon,
      tue,
      wed,
      thu,
      fri,
      sat,
      relationSettingId: session.id,
    },
  });

  // Fetch shop ID using the Shopify Admin API
  const shopResponse = await admin.graphql(
    `#graphql
      query {
        shop {
          id
        }
      }`,
  );
  const shopResponseJson = await shopResponse.json();
  const shopId = shopResponseJson.data?.shop?.id;

  if (!shopId) {
    throw new Error("Failed to fetch shop ID");
  }

  // Save the DateSelection data as a metafield for the shop
  const metafieldResponse = await admin.graphql(
    `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
    {
      variables: {
        metafields: [
          {
            key: "devesha",
            namespace: "date-data",
            ownerId: shopId,
            type: "json",
            value: JSON.stringify(dbDateSelection), // Convert to JSON string
          },
        ],
      },
    },
  );

  const metafieldResponseJson = await metafieldResponse.json();
  console.log(
    metafieldResponseJson?.data?.metafieldsSet?.metafields,
    "metafieldResponseJson?.data",
  );

  // Check for errors in the metafield response
  if (metafieldResponseJson.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error(
      "Metafield errors:",
      metafieldResponseJson.data.metafieldsSet.userErrors,
    );
    throw new Error("Failed to save metafield");
  }

  return { dbDateSelection };
};

export default function Index() {
  const { dateSelection } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [selectionType, setSelectionType] = useState<string[]>([
    dateSelection.selectionType,
  ]);
  const [{ month, year }, setDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const getInitialDates = () => {
    if (selectionType[0] === "date_range") {
      return {
        start: dateSelection.dateRangeStart
          ? new Date(dateSelection.dateRangeStart)
          : new Date(),
        end: dateSelection.dateRangeEnd
          ? new Date(dateSelection.dateRangeEnd)
          : new Date(),
      };
    } else if (selectionType[0] === "specific_date") {
      const specificDate = dateSelection.specifyDates
        ? new Date(dateSelection.specifyDates)
        : new Date();
      return {
        start: specificDate,
        end: specificDate,
      };
    } else {
      return {
        start: new Date(),
        end: new Date(),
      };
    }
  };

  const [selectedDates, setSelectedDates] = useState(getInitialDates());
  const [selectedDays, setSelectedDays] = useState({
    sun: dateSelection.sun,
    mon: dateSelection.mon,
    tue: dateSelection.tue,
    wed: dateSelection.wed,
    thu: dateSelection.thu,
    fri: dateSelection.fri,
    sat: dateSelection.sat,
  });

  const handleSelectionChange = useCallback((value: string[]) => {
    setSelectionType(value);
  }, []);

  const handleMonthChange = useCallback(
    (month: number, year: number) => setDate({ month, year }),
    [],
  );

  const handleDayChange = useCallback((day: keyof typeof selectedDays) => {
    setSelectedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  }, []);

  const submitDate = () => {
    const payload = {
      selectionType: selectionType[0],
      ...(selectionType[0] === "specific_date" && {
        specificDate: selectedDates.start.toLocaleDateString("en-CA"),
      }),
      ...(selectionType[0] === "date_range" && {
        dateRangeStart: selectedDates.start.toLocaleDateString("en-CA"),
        dateRangeEnd: selectedDates.end.toLocaleDateString("en-CA"),
      }),
      ...(selectionType[0] === "specific_day" && {
        sun: selectedDays.sun ? "on" : "off",
        mon: selectedDays.mon ? "on" : "off",
        tue: selectedDays.tue ? "on" : "off",
        wed: selectedDays.wed ? "on" : "off",
        thu: selectedDays.thu ? "on" : "off",
        fri: selectedDays.fri ? "on" : "off",
        sat: selectedDays.sat ? "on" : "off",
      }),
    };

    fetcher.submit(payload, { method: "POST" });
  };

  useEffect(() => {
    console.log(fetcher, "fetcher");

    if (fetcher.state === "idle" && fetcher.data) {
      shopify.toast.show("Date selection saved");
    }
  }, [fetcher.state, fetcher.data, shopify]);

  return (
    <Page>
      <TitleBar title="Date Selection">
        <button variant="primary" onClick={submitDate}>
          Save
        </button>
      </TitleBar>
      <BlockStack gap="400">
        <Card>
          <Text as="h2">Date Selection Type</Text>
          <ChoiceList
            title=""
            choices={[
              { label: "Specific Day", value: "specific_day" },
              { label: "Specific Date", value: "specific_date" },
              { label: "Date Range", value: "date_range" },
            ]}
            selected={selectionType}
            onChange={handleSelectionChange}
          />
        </Card>

        {selectionType[0] === "specific_day" && (
          <Card>
            <Text as="h2">Select Days</Text>
            <InlineStack gap="200">
              {Object.entries(selectedDays).map(([day, checked]) => (
                <Button
                  key={day}
                  pressed={checked}
                  onClick={() =>
                    handleDayChange(day as keyof typeof selectedDays)
                  }
                >
                  {day.toUpperCase()}
                </Button>
              ))}
            </InlineStack>
          </Card>
        )}

        {selectionType[0] === "specific_date" && (
          <Card>
            <Text as="h2">Specific Date</Text>
            <DatePicker
              month={month}
              year={year}
              onChange={setSelectedDates}
              onMonthChange={handleMonthChange}
              selected={{
                start: selectedDates.start,
                end: selectedDates.start,
              }}
            />
          </Card>
        )}

        {selectionType[0] === "date_range" && (
          <Card>
            <Text as="h2">Date Range</Text>
            <DatePicker
              month={month}
              year={year}
              onChange={setSelectedDates}
              onMonthChange={handleMonthChange}
              selected={selectedDates}
              allowRange
            />
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
