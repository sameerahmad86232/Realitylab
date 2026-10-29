# Visual Atlas polish

Adds original AI-generated editorial optical-assembly artwork, created for this website with the image-generation tool. It is displayed as concept art and explicitly distinguished from reconstructed scans. It does not use the Meta/Baseten connection to generate images at runtime. The existing scan API remains a vision/reasoning service.

The original PNG is retained in the execution workspace. The shipped WebP is about 75 KB, resized to 1440 pixels, with explicit image dimensions, lazy loading and asynchronous decoding. No image-generation request occurs when visitors open the page. The artwork does not appear as evidence inside user scans.

An interactive Observe / Understand / Make atlas explains the actual product workflow and opens a recorded real example. Lucide SVG icons organize materials and assembly stages; stage icons are navigational symbols, not generated representations of hidden geometry. Custom SVG locator linework, one-shot entrance motion, hover elevation, completion feedback and loading dots give the interface a coordinated visual language.

Animations use CSS opacity/transforms or a one-time SVG stroke reveal. A single IntersectionObserver triggers the atlas entrance and disconnects afterward. Reduced-motion settings disable the added animation and hover transforms. There are no animation libraries, extra API requests or persistent animation loops for the artwork. Loading dots animate only while a request is active.

Browser validation covers artwork loading, workflow selection, mobile widths, accessibility, reduced motion and the existing blueprint/build flows. AI generation created a static design asset, not verified engineering content.
