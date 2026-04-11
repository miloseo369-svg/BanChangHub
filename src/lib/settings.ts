import { createClient } from "@/lib/supabase-server";

export type SiteSettings = {
  contact_phone: string;
  promptpay_id: string;
  line_id: string;
  line_url: string;
  facebook_url: string;
  email: string;
};

const DEFAULTS: SiteSettings = {
  contact_phone: "",
  promptpay_id: "",
  line_id: "",
  line_url: "",
  facebook_url: "",
  email: "",
};

/** Server-side: ดึง settings ทั้งหมดจาก DB */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  if (!data) return DEFAULTS;

  const settings = { ...DEFAULTS };
  for (const row of data) {
    if (row.key in settings) {
      (settings as Record<string, string>)[row.key] = row.value;
    }
  }
  return settings;
}

/** Server-side: ดึง setting เดียว */
export async function getSetting(key: keyof SiteSettings): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();

  return data?.value ?? DEFAULTS[key];
}
