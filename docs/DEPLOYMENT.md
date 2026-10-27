# Deploy the full app

RealityLab needs a Node backend; a static-only site will not provide secure live
analysis. `render.yaml` defines a single Render web service serving the built React
app and `/api` from one HTTPS origin. The definition requests Render's free plan;
provider availability, account requirements and quotas are controlled by Render.

1. Open [Deploy on Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fsameerahmad86232%2FRealitylab&branch=codex%2Frealitylab-live-explorer), connect your hosting account, and select branch
   `codex/realitylab-live-explorer` containing `render.yaml`. The link opens Render setup, not a running website.
2. Enter the **real Baseten key** in Render's `BASETEN_API_KEY` secret field. The
   proxy-bound credential in the Codex environment is not transferable to Render.
   Do not paste a placeholder or put the key in the repository.
3. Deploy. The build installs both lockfiles and runs the frontend production
   build. `npm start` binds the platform-provided `PORT` on `0.0.0.0`.
4. Open the HTTPS URL Render assigns. `/api/health` should show `configured: true`.
   `liveVerified` stays false until a validated live analysis succeeds on that
   running instance. Upload a photo, give provider-sharing consent, and analyze.
5. Run the smoke check against the assigned URL:

   ```bash
   npm run smoke -- https://YOUR-SERVICE.onrender.com
   ```

The app uses Render's `RENDER_EXTERNAL_URL` for same-origin API checks. For another
host or a custom domain, set `APP_ORIGIN` to the exact HTTPS origin (no trailing
slash). Keys stay on the server. There is no image/project database; the notebook
lives in the browser tab until exported. Free hosts may sleep between visits;
open the demo ahead of judging. In-process concurrency and rate limits cover one
instance and reset when it restarts.

## What has and has not been deployed

The production build and local HTTP flow are testable in this workspace. Creating
this configuration does not create a Render account, service, billing agreement or
public URL. A hosting connection and the key on that host are required to finish
public deployment. The optional smoke check is read-only and consumes no AI credits.
