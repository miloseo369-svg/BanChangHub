// LINE Messaging API utilities

const LINE_API = "https://api.line.me/v2/bot";

function getChannelToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set");
  return token;
}

// ─── Send Messages ───

export async function lineReply(replyToken: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getChannelToken()}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  return res.ok;
}

export async function linePush(to: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getChannelToken()}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  return res.ok;
}

// ─── Flex Messages ───

export function listingFlexMessage(listing: {
  title: string;
  price: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  floor_area?: number;
  imageUrl?: string;
  url: string;
}): LineMessage {
  return {
    type: "flex",
    altText: `${listing.title} - ${listing.price}`,
    contents: {
      type: "bubble",
      size: "mega",
      hero: listing.imageUrl
        ? {
            type: "image",
            url: listing.imageUrl,
            size: "full",
            aspectRatio: "16:10",
            aspectMode: "cover",
          }
        : undefined,
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: listing.title,
            weight: "bold",
            size: "lg",
            wrap: true,
            maxLines: 2,
          },
          {
            type: "text",
            text: listing.price,
            weight: "bold",
            size: "xl",
            color: "#0d9488",
          },
          {
            type: "text",
            text: listing.location,
            size: "xs",
            color: "#999999",
            margin: "md",
          },
          ...(listing.bedrooms || listing.bathrooms || listing.floor_area
            ? [
                {
                  type: "box" as const,
                  layout: "horizontal" as const,
                  margin: "md" as const,
                  spacing: "md" as const,
                  contents: [
                    ...(listing.bedrooms
                      ? [{ type: "text" as const, text: `${listing.bedrooms} นอน`, size: "xs" as const, color: "#555555" }]
                      : []),
                    ...(listing.bathrooms
                      ? [{ type: "text" as const, text: `${listing.bathrooms} น้ำ`, size: "xs" as const, color: "#555555" }]
                      : []),
                    ...(listing.floor_area
                      ? [{ type: "text" as const, text: `${listing.floor_area} ตร.ม.`, size: "xs" as const, color: "#555555" }]
                      : []),
                  ],
                },
              ]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: listing.url,
            },
            style: "primary",
            color: "#0d9488",
          },
          {
            type: "button",
            action: {
              type: "uri",
              label: "โทรสอบถาม",
              uri: `tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "0812345678"}`,
            },
            style: "secondary",
          },
        ],
      },
    },
  };
}

export function appointmentReminderMessage(data: {
  title: string;
  date: string;
  time: string;
  location?: string;
  requesterName: string;
}): LineMessage {
  return {
    type: "flex",
    altText: `แจ้งเตือนนัดหมาย: ${data.title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "นัดหมายวันนี้",
            weight: "bold",
            size: "sm",
            color: "#0d9488",
          },
          {
            type: "text",
            text: data.title,
            weight: "bold",
            size: "md",
            wrap: true,
            maxLines: 2,
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "วันที่", size: "xs", color: "#999999", flex: 0 },
                  { type: "text", text: data.date, size: "xs", color: "#333333", align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "เวลา", size: "xs", color: "#999999", flex: 0 },
                  { type: "text", text: data.time, size: "xs", color: "#333333", align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ผู้นัด", size: "xs", color: "#999999", flex: 0 },
                  { type: "text", text: data.requesterName, size: "xs", color: "#333333", align: "end" },
                ],
              },
              ...(data.location
                ? [
                    {
                      type: "box" as const,
                      layout: "horizontal" as const,
                      contents: [
                        { type: "text" as const, text: "สถานที่", size: "xs" as const, color: "#999999", flex: 0 },
                        { type: "text" as const, text: data.location, size: "xs" as const, color: "#333333", align: "end" as const },
                      ],
                    },
                  ]
                : []),
            ],
          },
        ],
      },
    },
  };
}

// ─── Types ───

export type LineMessage = {
  type: string;
  altText?: string;
  text?: string;
  contents?: unknown;
  [key: string]: unknown;
};

export type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source: { userId?: string; type: string };
  message?: { type: string; text?: string };
  timestamp: number;
};
