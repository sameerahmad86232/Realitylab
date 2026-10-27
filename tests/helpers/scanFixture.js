// Explicit test-only object concepts. These are not real model responses.
export function scanFixture(category = "furniture") {
  const shape = (
    name,
    primitive,
    position,
    size,
    color = "#879b85",
    rotation = [0, 0, 0],
  ) => ({ name, primitive, position, size, color, rotation });
  const definitions = {
    furniture: [
      shape("Seat", "box", [0, 0.4, 0], [1, 0.15, 0.85], "#72513a"),
      shape("Backrest", "box", [0, 1, -0.35], [1, 1, 0.12], "#72513a"),
      shape(
        "Left support",
        "cylinder",
        [-0.4, -0.1, 0.3],
        [0.1, 1, 0.1],
        "#707974",
      ),
      shape(
        "Right support",
        "cylinder",
        [0.4, -0.1, 0.3],
        [0.1, 1, 0.1],
        "#707974",
      ),
    ],
    electronics: [
      shape(
        "Mouse housing",
        "ellipsoid",
        [0, 0, 0],
        [0.8, 0.5, 1.3],
        "#363d40",
      ),
      shape(
        "Scroll wheel",
        "cylinder",
        [0, 0.25, 0.3],
        [0.2, 0.12, 0.2],
        "#a74035",
        [0, 0, Math.PI / 2],
      ),
    ],
    appliance: [
      shape("Fan grille", "torus", [0, 0.65, 0], [1.3, 1.3, 0.15], "#85918b"),
      shape("Support stem", "cylinder", [0, -0.25, -0.15], [0.12, 1.2, 0.12]),
      shape("Fan base", "ellipsoid", [0, -0.8, -0.15], [0.8, 0.12, 0.6]),
    ],
    tool: [
      shape(
        "Tool handle",
        "capsule",
        [0, -0.1, 0],
        [0.16, 1.3, 0.16],
        "#996b35",
      ),
      shape("Tool head", "box", [0, 0.65, 0], [0.7, 0.25, 0.3], "#89908c"),
    ],
    natural: [
      shape("Plant pot", "tube", [0, -0.5, 0], [0.6, 0.6, 0.6], "#a96d47"),
      shape(
        "Visible stem",
        "cylinder",
        [0, 0.15, 0],
        [0.06, 1.1, 0.06],
        "#5c7947",
      ),
      shape(
        "Visible leaf",
        "ellipsoid",
        [0.23, 0.5, 0],
        [0.65, 0.13, 0.3],
        "#6f8b4b",
        [0, 0, 0.4],
      ),
    ],
    vehicle: [
      shape("Vehicle body", "box", [0, 0.2, 0], [1.4, 0.4, 0.7], "#a6afa9"),
      shape(
        "Visible wheel",
        "cylinder",
        [-0.4, -0.1, 0.35],
        [0.4, 0.15, 0.4],
        "#3c4440",
        [Math.PI / 2, 0, 0],
      ),
    ],
    mechanism: [
      shape("Visible housing", "box", [0, 0, 0], [1, 0.8, 0.6]),
      shape("Visible shaft", "cylinder", [0, 0.6, 0], [0.12, 0.7, 0.12]),
    ],
    other: [
      shape("Visible object body", "ellipsoid", [0, 0, 0], [0.8, 1.1, 0.6]),
    ],
    unclear: [
      shape("Unfamiliar visible form", "capsule", [0, 0, 0], [0.6, 1.2, 0.6]),
    ],
  };
  const shapes = definitions[category] || definitions.other;
  const observations = shapes.map((s, i) => ({
    id: `part-${i}`,
    imageId: "image-1",
    name: s.name,
    marker: { x: 0.25 + (i % 3) * 0.2, y: 0.3 + (i % 2) * 0.35 },
    evidence: `Test-only visible evidence for ${s.name}.`,
    function: `Test-only suggested role for ${s.name}.`,
  }));
  return {
    objectName: `Fixture ${category} scan`,
    summary: `Injected test-only ${category} object, not a live AI result.`,
    category,
    recognition: category === "unclear" ? "uncertain" : "identified",
    observations,
    relationships: [],
    hypotheses: [],
    unknowns: ["True depth and physical size need measurement."],
    nextSteps: ["Photograph the same object from another angle."],
    mechanism: { type: "unsupported", gears: [] },
    spatialModel: {
      kind: "approximate-component-model",
      parts: shapes.map((s, i) => ({
        observationId: `part-${i}`,
        primitive: s.primitive,
        position: s.position,
        size: s.size,
        rotation: s.rotation,
        color: s.color,
        innerRatio: 0.6,
        basis: `Test fixture geometry for ${s.name}; depth is assumed.`,
      })),
      assumptions: [
        "This is an injected conceptual fixture, not reconstruction.",
      ],
    },
    operation: {
      summary: `Test-only explanation of the ${category} object.`,
      steps: [
        {
          title: "Inspect the supporting structure",
          description:
            "Read the visible evidence and check the suggested role against another view.",
          observationIds: [observations.at(-1).id],
        },
      ],
    },
    recreationGuide: {
      scope: "unpowered-study-model",
      materials: ["Cardboard", "Paper"],
      measurementsNeeded: [
        `Measure the visible ${category} object width; no value is inferred.`,
      ],
      steps: [
        {
          title: `Sketch the ${category} structure`,
          instruction:
            "Draw the visible outline and label assumptions before making an unpowered study model.",
          check: "Compare the outline with the source photo.",
        },
      ],
      limitations: ["Not a functional or load-bearing build plan."],
    },
  };
}
