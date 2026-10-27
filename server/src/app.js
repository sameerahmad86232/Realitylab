import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ZodError } from "zod";
import { modelAnalysisSchema } from "../../shared/schemas.js";
import { predict, compare } from "../../shared/gearMath.js";
import { predictPhysicsTool } from "../../shared/physicsTools.js";
import { providerFromEnvironment } from "./provider.js";
const fail = (status, message) => Object.assign(Error(message), { status });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
    fields: 3,
    fieldSize: 4000,
    parts: 6,
  },
});
const mimeFormats = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
export function createApp({
  provider = providerFromEnvironment(),
  timeoutMs = 90000,
  origin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL,
  rateLimitEnabled = true,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  let active = 0;
  let lastSuccessfulAnalysisAt = null;
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    if (req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-store");
      req.requestId = randomUUID();
      res.setHeader("X-Request-ID", req.requestId);
    }
    next();
  });
  app.use("/api", (req, res, next) => {
    const source = req.headers.origin;
    const allowed = origin
      ? [origin]
      : [
          `${req.protocol}://${req.get("host")}`,
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:3001",
          "http://127.0.0.1:3001",
        ];
    if (source && !allowed.includes(source))
      return next(fail(403, "This origin cannot call the API."));
    next();
  });
  if (rateLimitEnabled)
    app.use(
      "/api",
      rateLimit({
        windowMs: 60000,
        limit: 60,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
          error: {
            message: "Too many requests. Wait a minute and retry.",
            retryable: true,
          },
        },
      }),
    );
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (req, res) =>
    res.json({
      status: "ok",
      analysis: {
        configured: provider.configured,
        liveVerified: Boolean(lastSuccessfulAnalysisAt),
        lastSuccessfulAnalysisAt,
        provider: provider.configured ? provider.provider : null,
        model: provider.configured ? provider.model : null,
        missing: provider.missing || [],
      },
      capabilities: [
        "general-object-exploration",
        "component-relationship-map",
        "manual-ideal-lever",
        "manual-ideal-pulley",
        "manual-external-gear-pair",
        "prediction",
        "measurement-comparison",
        "json-svg-export",
      ],
      retention: "No server-side image or project persistence.",
    }),
  );
  app.post("/api/tools/predict", (req, res) =>
    res.json(predictPhysicsTool(req.body)),
  );
  app.post("/api/predict", (req, res) => res.json(predict(req.body)));
  app.post("/api/compare", (req, res) => res.json(compare(req.body)));
  const analyzeLimit = rateLimitEnabled
    ? rateLimit({
        windowMs: 60000,
        limit: 6,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
          error: {
            message: "Analysis limit reached. Wait a minute and retry.",
            retryable: true,
          },
        },
      })
    : (req, res, next) => next();
  app.post("/api/analyze", analyzeLimit, async (req, res, next) => {
    if (!provider.configured)
      return next(
        fail(
          503,
          "Live image analysis is not configured. Manual experiments and the labeled sample remain available.",
        ),
      );
    if (active >= 2)
      return next(
        fail(429, "Two analyses are already running. Try again shortly."),
      );
    active++;
    const abort = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, timeoutMs);
    const disconnect = () => {
      if (!res.writableEnded) abort.abort();
    };
    res.on("close", disconnect);
    try {
      await new Promise((resolve, reject) =>
        upload.array("images", 3)(req, res, (err) =>
          err ? reject(err) : resolve(),
        ),
      );
      if (req.body.consent !== "true")
        throw fail(
          400,
          "Consent to send photos to the configured inference provider is required.",
        );
      const context = req.body.context || "";
      if (typeof context !== "string" || context.length > 1000)
        throw fail(400, "Object context must be at most 1,000 characters.");
      if (!req.files?.length) throw fail(400, "Upload one to three images.");
      const images = [];
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i];
        if (!mimeFormats[f.mimetype])
          throw fail(415, "Only JPEG, PNG and WebP images are supported.");
        try {
          const meta = await sharp(f.buffer, {
            limitInputPixels: 20000000,
            animated: false,
          }).metadata();
          if (meta.format !== mimeFormats[f.mimetype] || (meta.pages || 1) > 1)
            throw fail(
              415,
              "Image content must match its MIME type and must not be animated.",
            );
          const { data, info } = await sharp(f.buffer, {
            limitInputPixels: 20000000,
          })
            .rotate()
            .resize({
              width: 1600,
              height: 1600,
              fit: "inside",
              withoutEnlargement: true,
            })
            .jpeg({ quality: 85 })
            .toBuffer({ resolveWithObject: true });
          images.push({
            id: `image-${i + 1}`,
            width: info.width,
            height: info.height,
            dataUrl: `data:image/jpeg;base64,${data.toString("base64")}`,
          });
        } catch (err) {
          if (err.status) throw err;
          throw fail(
            415,
            "An image could not be decoded or exceeds the 20 megapixel limit.",
          );
        }
      }
      const work = Promise.resolve(
        provider.analyze({ images, context, signal: abort.signal }),
      );
      const cancelled = new Promise((_, reject) => {
        if (abort.signal.aborted)
          reject(fail(504, "Analysis was cancelled or timed out."));
        else
          abort.signal.addEventListener(
            "abort",
            () => reject(fail(504, "Analysis was cancelled or timed out.")),
            { once: true },
          );
      });
      let raw;
      try {
        raw = await Promise.race([work, cancelled]);
      } catch (err) {
        if (err.status) throw err;
        throw fail(
          502,
          "The provider returned an unusable response. Your photos have not been replaced with a sample.",
        );
      }
      const parsed = modelAnalysisSchema.safeParse(raw);
      if (!parsed.success)
        throw fail(
          502,
          "The model returned invalid analysis data. Retry with clearer photos.",
        );
      const analysis = parsed.data;
      if (analysis.recognition === "no-object")
        throw fail(
          422,
          "No clear object was found. Try a closer, well-lit photo with the object fully visible.",
        );

      const imageIds = new Set(images.map((i) => i.id));
      if (analysis.observations.some((o) => !imageIds.has(o.imageId)))
        throw fail(
          502,
          "The model referenced an image that was not submitted.",
        );
      const ids = new Map(
        analysis.observations.map((o) => [o.id, `obs-${randomUUID()}`]),
      );
      analysis.observations = analysis.observations.map((o) => ({
        ...o,
        id: ids.get(o.id),
        source: "model-suggested",
      }));
      analysis.relationships = analysis.relationships.map((edge) => ({
        ...edge,
        id: randomUUID(),
        source: ids.get(edge.source),
        target: ids.get(edge.target),
        origin: "model-suggested",
      }));
      analysis.hypotheses = analysis.hypotheses.map((h) => ({
        ...h,
        id: randomUUID(),
        source: "model-suggested",
      }));
      analysis.mechanism.gears = analysis.mechanism.gears.map((g) => ({
        ...g,
        observationId: ids.get(g.observationId),
        toothCountSource: g.toothCount === null ? "unknown" : "model-suggested",
      }));
      if (analysis.spatialModel)
        analysis.spatialModel = {
          ...analysis.spatialModel,
          parts: analysis.spatialModel.parts.map((p) => ({
            ...p,
            observationId: ids.get(p.observationId),
            source: "model-suggested",
          })),
        };
      if (analysis.operation)
        analysis.operation = {
          ...analysis.operation,
          steps: analysis.operation.steps.map((step) => ({
            ...step,
            observationIds: step.observationIds.map((id) => ids.get(id)),
          })),
        };
      lastSuccessfulAnalysisAt = new Date().toISOString();
      res.json({
        ...analysis,
        schemaVersion: "1.2",
        id: randomUUID(),
        mode: "live",
        images,
        provenance: {
          provider: provider.provider,
          model: provider.model,
          analyzedAt: new Date().toISOString(),
        },
        notice:
          "Model observations and hypotheses need verification. No server-side persistence.",
      });
    } catch (err) {
      if (timedOut)
        next(
          fail(
            504,
            "Analysis timed out. Your inputs are preserved; retry when ready.",
          ),
        );
      else next(err);
    } finally {
      clearTimeout(timer);
      res.off("close", disconnect);
      active--;
      if (req.files)
        req.files.forEach((f) => {
          f.buffer = null;
        });
    }
  });
  app.use("/api", (req, res, next) => next(fail(404, "API route not found.")));
  const dist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
  app.use(express.static(dist, { index: "index.html" }));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status =
      err instanceof ZodError
        ? 400
        : err instanceof multer.MulterError
          ? err.code === "LIMIT_FILE_SIZE"
            ? 413
            : 400
          : err.type === "entity.too.large"
            ? 413
            : err.status || 500;
    const message =
      err instanceof ZodError
        ? "Invalid inputs. Check confirmed measurements, supported tool types, units and numerical ranges."
        : err instanceof multer.MulterError
          ? err.code === "LIMIT_FILE_SIZE"
            ? "Each image must be at most 5 MB."
            : "Upload at most three images with the expected form fields."
          : err.type === "entity.parse.failed"
            ? "Malformed JSON request."
            : status === 500
              ? "The request could not be completed."
              : err.message;
    res.status(status).json({
      error: {
        message,
        requestId: req.requestId,
        retryable: [429, 502, 503, 504].includes(status),
      },
    });
  });
  return app;
}
