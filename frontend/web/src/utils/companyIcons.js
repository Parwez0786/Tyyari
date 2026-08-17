/** Public company icons via Google's favicon helper. Falls back to a letter mark in the UI. */
export const COMPANY_ICONS = {
  Google: { domain: "google.com", color: "#4285F4" },
  Meta: { domain: "meta.com", color: "#0866FF" },
  Amazon: { domain: "amazon.com", color: "#FF9900" },
  Microsoft: { domain: "microsoft.com", color: "#00A4EF" },
  Netflix: { domain: "netflix.com", color: "#E50914" },
  Uber: { domain: "uber.com", color: "#000000" },
  Airbnb: { domain: "airbnb.com", color: "#FF5A5F" },
  LinkedIn: { domain: "linkedin.com", color: "#0A66C2" },
  Stripe: { domain: "stripe.com", color: "#635BFF" },
  Apple: { domain: "apple.com", color: "#111111" },
  Tesla: { domain: "tesla.com", color: "#CC0000" },
  Adobe: { domain: "adobe.com", color: "#FF0000" },
  Oracle: { domain: "oracle.com", color: "#F80000" },
  Salesforce: { domain: "salesforce.com", color: "#00A1E0" },
  Dropbox: { domain: "dropbox.com", color: "#0061FF" },
};

export function companyIconUrl(name) {
  const entry = COMPANY_ICONS[name];
  if (!entry) return null;
  return `https://www.google.com/s2/favicons?domain=${entry.domain}&sz=64`;
}
