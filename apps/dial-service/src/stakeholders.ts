// The stakeholder directory lives only on the server (STAKEHOLDERS_JSON), so a
// caller picks a person by id and can never make the service dial an arbitrary
// number. Shape: { "<engagement_id>": [Stakeholder, ...] }.

export type Stakeholder = {
  id: string;
  name: string;
  role: string;
  phone: string;
  expertise?: string[];
  authorized?: boolean;
};

function allEngagements(): Record<string, Stakeholder[]> {
  return JSON.parse(process.env.STAKEHOLDERS_JSON ?? "{}") as Record<string, Stakeholder[]>;
}

export function directory(engagementId: string): Stakeholder[] {
  return (allEngagements()[engagementId] ?? []).filter((s) => s.authorized !== false);
}

export function publicView({ phone, ...rest }: Stakeholder) {
  return { ...rest, phone_on_file: Boolean(phone) };
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9$]+/g) ?? [];

// The stakeholder whose expertise and role best overlap the question, or
// undefined when nobody overlaps at all.
export function bestMatch(people: Stakeholder[], text: string): Stakeholder | undefined {
  const asked = new Set(words(text));
  const score = (p: Stakeholder) =>
    [...(p.expertise ?? []), p.role].flatMap(words).filter((t) => asked.has(t)).length;
  const ranked = people.map((p) => ({ p, s: score(p) })).filter((x) => x.s > 0);
  return ranked.sort((a, b) => b.s - a.s)[0]?.p;
}

// Which engagement an inbound text belongs to.
export function engagementForPhone(phone: string): string | undefined {
  return Object.entries(allEngagements()).find(([, people]) =>
    people.some((p) => p.phone === phone && p.authorized !== false),
  )?.[0];
}
