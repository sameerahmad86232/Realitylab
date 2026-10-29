# Phase 6 live timing sample

`phase6-live.json` retains one explicit, bounded request against the deployed Phase 6 revision. The existing evaluation runner sent the curated fan image once with a request limit of one and no automatic retry.

The 15.053-second client-observed request contained 14.740 seconds of server work: 0.192 seconds reading the request, 0.242 seconds normalizing the image, 0.001 seconds checking the currently unconfigured durable-quota layer, and 14.305 seconds waiting for Meta inference through Baseten. The provider reported 4,460 tokens.

This single sample identifies the provider call as the dominant observed segment for this request. It is not a distribution, benchmark, SLA, correctness result or dollar-cost calculation. The object is curated, no independent human correctness review was performed, and the shared quota/provider billing cap remained unverified.
