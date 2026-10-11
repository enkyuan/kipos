import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { ISSUE_TYPES } from "./contract";

const ref = (what: string) =>
  Type.Union([Type.String(), Type.Null()], {
    description: `Id of the existing ${what} this record is about, or null for a new one.`,
  });
const ids = (description: string, minItems = 0) =>
  Type.Array(Type.Integer(), { minItems, maxItems: 20, description });

/**
 * What the model returns (as the `record_analysis` tool input): only the
 * requirements and issues that are new or changed by the new utterances.
 * Two empty lists are a valid, common answer.
 */
export const modelOutputSchema = Type.Object(
  {
    requirements: Type.Array(
      Type.Object(
        {
          ref: ref("requirement"),
          description: Type.String({ minLength: 1, maxLength: 500 }),
          evidenceUtteranceIds: ids("Utterances that state or support this requirement.", 1),
          confirmedByUtteranceIds: ids(
            "Utterances where a participant explicitly confirms or agrees to it. Empty unless they do.",
          ),
          supersedes: Type.Union([Type.String(), Type.Null()], {
            description: "Id of an existing requirement this one replaces, or null.",
          }),
        },
        { additionalProperties: false },
      ),
      { maxItems: 20 },
    ),
    issues: Type.Array(
      Type.Object(
        {
          ref: ref("issue"),
          type: Type.Union(ISSUE_TYPES.map((type) => Type.Literal(type))),
          summary: Type.String({ minLength: 1, maxLength: 160, description: "A short title." }),
          implementationImpact: Type.String({
            minLength: 1,
            maxLength: 400,
            description: "Which implementation decision depends on the answer, and why.",
          }),
          suggestedQuestion: Type.String({ minLength: 1, maxLength: 300 }),
          suggestedOwner: Type.Union([Type.String(), Type.Null()], {
            description: "Who should answer, only if the transcript says so; else null.",
          }),
          evidenceUtteranceIds: ids("Utterances that show the gap.", 1),
          priority: Type.Union([Type.Literal("low"), Type.Literal("medium"), Type.Literal("high")]),
          resolvedByUtteranceIds: ids(
            "For an existing issue: the utterances that answer it. Empty if still open.",
          ),
        },
        { additionalProperties: false },
      ),
      { maxItems: 20 },
    ),
  },
  { additionalProperties: false },
);

export type ModelOutput = Static<typeof modelOutputSchema>;

/** The model's answer if it matches the schema exactly, else the first problems found. */
export function parseModelOutput(
  value: unknown,
): { ok: true; output: ModelOutput } | { ok: false; problems: string[] } {
  if (Value.Check(modelOutputSchema, value)) return { ok: true, output: value };
  const problems = [...Value.Errors(modelOutputSchema, value)]
    .slice(0, 5)
    .map((error) => `${error.path || "/"}: ${error.message}`);
  return { ok: false, problems };
}
