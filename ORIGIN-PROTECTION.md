# Website origin protection

The public entry point is `https://www.switching-formation.fr`, proxied through
Cloudflare with its included automatic DDoS protection and standard asset cache.
HTML, CSS and JavaScript keep their existing immediate revalidation; API and
administration responses keep `private, no-store`. No cache-everything rule.

Cloudflare's request-header transform `switching_site_origin_auth` **overwrites**
`X-Switching-Origin` on this exact hostname. Its random value must match the
Railway service variable `SITE_ORIGIN_TOKEN` (at least 32 characters). The value
is a server-side secret; never place it in a page, script, URL or log. Production
startup refuses a missing/short token. Local tests without `NODE_ENV=production`
may omit it; set it to exercise origin authentication locally.

The first Express middleware checks the token before parsing bodies, serving
files, reading databases or invoking the chatbot. Missing or incorrect values
return a small, uncached 403, including on the Railway-generated hostname.
`CF-Connecting-IP` is used by the existing per-client rate limits only after the
origin token is verified; global limits remain in place. Rotating a client-sent
`X-Forwarded-For` header cannot bypass those per-client limits.

This authenticates requests at the application; it is not a Railway network
firewall. Direct rejected requests still reach Railway's edge and the small
authentication middleware. Cloudflare reduces abusive traffic on the public
hostname; no promise of immunity to every attack or zero origin traffic.

The browser-signature heuristic (Browser Integrity Check) is disabled to preserve
legitimate non-browser API clients, including the existing audience reader.
Automatic DDoS protection remains enabled. Custom WAF/rate-limit rules were not
added: the current Cloudflare token does not authorize those phases.

Deploy order: configure the overwrite rule, stage the Railway variable, enable
the www proxy, verify normal pages and API clients, then deploy the guard.
Never disable the proxy alone while the guard is enforced: the public hostname
would lose the authentication header. Restore service with the previous code
before reverting the proxy, or repair the rule/variable pair.

Dependencies: `compression` is pinned to 1.8.2 to fix the aborted-response memory
leak. Compatible `body-parser` and `proxy-addr` patches are locked as well. The
`qs` override pins 6.16.1 because Express 4's own narrow range otherwise keeps a
version reported vulnerable by npm. Keep Express 4 and re-evaluate this override
when its upstream range is updated.

Validation: `node test-static-delivery.cjs`, `node test-audience.cjs`,
`node --test test-ai-client.cjs`, `node test-origin-protection.cjs`, `npm audit`.
The origin tests use a disposable database, a synthetic AI implementation and no
mail credentials. They verify public/admin behavior, direct-origin rejection,
MMFCPF preflight, form/chat routes and rate limits with spoofed forwarding headers.
