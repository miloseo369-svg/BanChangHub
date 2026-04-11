// JSON-LD Structured Data generators for SEO Rich Results

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.com";
const SITE_NAME = "BanChangHub";

export function organizationJsonLd(contactPhone?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    alternateName: "บ้านช่างฮับ",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: "แพลตฟอร์มอสังหาริมทรัพย์และรับเหมาก่อสร้างครบวงจร สำหรับอีสานตอนบน",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: 17.4138, longitude: 102.7872 },
      geoRadius: "200000",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "อุดรธานี",
      addressRegion: "อุดรธานี",
      addressCountry: "TH",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: contactPhone ?? process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
      contactType: "customer service",
      availableLanguage: "Thai",
    },
    sameAs: [],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/listings?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function listingJsonLd(listing: {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  listing_type?: string | null;
  address?: string | null;
  district?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_area?: number | null;
  images: string[];
  agent_name?: string | null;
  created_at: string;
}) {
  const typeMap: Record<string, string> = {
    sell: "https://schema.org/OfferForSale",
    rent: "https://schema.org/OfferForLease",
    transfer: "https://schema.org/OfferForSale",
  };

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description ?? listing.title,
    url: `${SITE_URL}/listings/${listing.id}`,
    datePosted: listing.created_at,
    image: listing.images.length > 0 ? listing.images : undefined,
    offers: listing.price
      ? {
          "@type": "Offer",
          price: listing.price,
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
          ...(listing.listing_type && typeMap[listing.listing_type]
            ? { "@type": typeMap[listing.listing_type] }
            : {}),
        }
      : undefined,
    address: (listing.district || listing.province)
      ? {
          "@type": "PostalAddress",
          addressLocality: listing.district ?? undefined,
          addressRegion: listing.province ?? undefined,
          addressCountry: "TH",
          streetAddress: listing.address ?? undefined,
        }
      : undefined,
    geo:
      listing.latitude && listing.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: listing.latitude,
            longitude: listing.longitude,
          }
        : undefined,
    numberOfRooms: listing.bedrooms ?? undefined,
    numberOfBathroomsTotal: listing.bathrooms ?? undefined,
    floorSize: listing.floor_area
      ? { "@type": "QuantitativeValue", value: listing.floor_area, unitCode: "MTK" }
      : undefined,
  };
}

export function articleJsonLd(article: {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? article.title,
    url: `${SITE_URL}/articles/${article.slug}`,
    image: article.cover_image ?? undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at ?? article.published_at ?? undefined,
    author: article.author_name
      ? { "@type": "Person", name: article.author_name }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function localBusinessJsonLd(data: {
  name: string;
  province: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: `${SITE_NAME} ${data.province}`,
    description: data.description,
    url: data.url,
    areaServed: {
      "@type": "AdministrativeArea",
      name: data.province,
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: data.province,
      addressCountry: "TH",
    },
    parentOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function reviewAggregateJsonLd(data: {
  name: string;
  url: string;
  ratingValue: number;
  reviewCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    url: data.url,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.ratingValue,
      bestRating: 5,
      worstRating: 1,
      reviewCount: data.reviewCount,
    },
  };
}
