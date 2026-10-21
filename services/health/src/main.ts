/**
 * Stackra file contract:
 * Purpose: process entry of @figentra/service-health, the hello-world placeholder until the service is built.
 * Boundary: writes one line; wires no module and starts no server.
 * Runtime: node
 * Governing contract: ADR 0007 (documentation); ADR 0010 (services are independent members).
 */
process.stdout.write("Hello from @figentra/service-health\n");
