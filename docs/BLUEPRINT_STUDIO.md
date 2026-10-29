# Blueprint studio update

The landing page now previews a real recorded fan's conceptual blueprint. Its studio button opens that recorded example directly in blueprint view; no inference request is made.

Results have an evidence summary and wider blueprint workspace, a graphite theme alongside classic blue/paper, and local photo/edge study controls. The edge study uses Sobel contrast detection over a maximum 900-pixel source image. It traces visible contrast, including background; it does not segment components, recover internals, measure dimensions or create CAD. Original photos remain available in the evidence view.

Photo guides are processed once per source view and retained while switching display modes. CPU processing has bounded pixel count; obsolete work is canceled and image bitmaps released. Memoized layout and diagram generation avoid repeated work on unrelated state changes. No new AI requests are involved. This is a rendering-work reduction, not a measured inference-speed claim.

Exports remain photo-free by default. Explicit source-photo inclusion embeds either the original prepared photo or the edge trace selected in the studio. The SVG metadata records image-edge-trace versus photo rendering. An edge trace still derives from a source photo and requires the same explicit export opt-in. External/executable image references remain rejected.

Validation covers graphite output, trace provenance, bounded image dimensions, both explicit embedding and photo-free exports, keyboard selection, mobile widths and accessibility. AI provider calls use fixtures in automated tests. Real phone performance remains to be measured.
